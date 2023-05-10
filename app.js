const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    `DB Error: ${e.message}`;
  }
};
initializeDbAndServer();

// camel cases
const snakeToCamel1 = (object) => {
  return {
    stateId: object.state_id,
    stateName: object.state_name,
    population: object.population,
  };
};

//API 1 state details
app.get("/states/", async (request, response) => {
  const getCovidStates = `SELECT * FROM state;`;
  const statesList = await db.all(getCovidStates);
  const result = statesList.map((each) => snakeToCamel1(each));
  response.send(result);
});

// camel cases
const snakeToCamel2 = (object) => {
  return {
    districtId: object.district_id,
    districtName: object.district_name,
    stateId: object.state_id,
    cases: object.cases,
    cured: object.cured,
    active: object.active,
    deaths: object.deaths,
  };
};

//API 2 state details
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateDetails = `SELECT * FROM state where state_id = ${stateId};`;
  const state = await db.get(stateDetails);
  const result = snakeToCamel1(state);
  response.send(result);
});

//API 3 post district details

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `INSERT INTO district (district_name, state_id, cases, cured, active, deaths) VALUES ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

// API 4 district details
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = `SELECT * FROM district where district_id = ${districtId};`;
  const district = await db.get(districtDetails);
  const result = snakeToCamel2(district);
  response.send(result);
});

// API 5  /districts/:districtId/
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictDetails = `DELETE FROM district where district_id = ${districtId};`;
  await db.run(deleteDistrictDetails);
  response.send("District Removed");
});

/// 6 district details put
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
  UPDATE district  SET
         district_name = '${districtName}' , 
         state_id = ${stateId} , 
         cases = ${cases} ,
         cured = ${cured} ,
         active = ${active} ,
         deaths = ${deaths} 

   WHERE 
        district_id = ${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// camel vases
const snakeToCamel3 = (object) => {
  return {
    totalCases: object.cases,
    totalCured: object.cured,
    totalActive: object.active,
    totalDeaths: object.deaths,
  };
};
//7 API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const statesCovidDetails = `SELECT 
  SUM(cases) AS cases, 
  SUM(cured) AS cured, 
  SUM(active) AS active, 
  SUM(deaths) AS deaths 
  FROM district 
  WHERE 
  district.state_id = ${stateId};`;
  const dbResponse = await db.get(statesCovidDetails);
  const result = snakeToCamel3(dbResponse);
  response.send(result);
});

// API 8 state name
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateDetails = `SELECT state_name FROM state JOIN district ON state.state_id = district.state_id WHERE district.district_id = ${districtId};`;
  const stateName = await db.get(stateDetails);
  response.send({ stateName: stateName.state_name });
});
module.exports = app;
