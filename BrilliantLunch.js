var mysql = require('mysql');
const bodyParser = require('body-parser');

var dbClient;
const express = require('express')
const app = express()
app.use(function(req, res, next) {
 res.header("Access-Control-Allow-Origin", "*");
 res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
 next();
});

app.listen(5030, () => console.log("server running on port 5030"));

app.use(bodyParser.urlencoded({
 extended: true
}));

app.use(bodyParser.json());

console.log("Connecting to database ..");
dbClient = mysql.createConnection({
 host: 'bh.amazonaws.com',
 database: 'dbBH',
 user: 'user',
 password: 'password'
});

var that = this;
dbClient.connect(function(err) {

 if (err) {
  console.log(err);
  throw err;
 }

 /*verify user*/
 app.post('/verifyuser', (req, res) => {
  var jsondata = req.body;
  var data = [];
  console.log(jsondata.Email);
  console.log(jsondata.Password);
  try {
   dbClient.query("SELECT UsrId from Log_In where Email LIKE '" + jsondata.Email + "';", function(err, result, fields) {
    if (err) {

     data.push({
      Message: "Invalid Credentials"
     });

    } else {
     if (result[0] !== undefined) {
      var userId = result[0].UsrId;
      dbClient.query("SELECT EndUser.* , Organization.Name as Company,MapRole.RoleName as Role,Log_In.Password as Password FROM EndUser INNER JOIN Organization ON EndUser.OrganizationId = Organization.OrganizationId INNER JOIN MapRole ON EndUser.RoleId = MapRole.RoleId  INNER JOIN Log_In ON Log_In.UsrId = EndUser.UsrId WHERE UsrId =" + userId + ";", function(err, result, fields) {
       if (err) {
        data.push({
         Message: "Invalid Credentials"
        });
       } else {
        console.log("result" + result.length);
        debugger;
        for (var i = 0; i < result.length; i++) {
         data.push({
          UserId: result[i].UsrId,
          FName: result[i].FName,
          LName: result[i].LName,
          OrganizationId: result[i].OrganizationId,
          RoleId: result[i].RoleId,
          Email: result[i].Email,
          SignUpTime: result[i].SignUpTime,
          Organization: result[i].Company,
          Role: result[i].Role,
          Password: result[i].Password
         });
        }

        console.log("data" + JSON.stringify(data));
        res.send(JSON.stringify(data));
       }

      });
     } else {

      data.push({
       Message: "Invalid Credentials"
      });
      res.send(JSON.stringify(data));
     }

    }

   });
  } catch (err) {
   console.log(err);
  }
 });

 /*API to create user*/
 app.post('/createuser', (req, res) => {
  var jsondata = req.body;
  var data = [];
  console.log("request" + jsondata);
  try {
   dbClient.query("INSERT INTO dbBh.EndUser(FName,LName,OrganizationId,RoleId,Email,SignUpTime)values('" + jsondata.FName + "','" + jsondata.LName + "'," + jsondata.CompanyId + "," + jsondata.RoleId + ",'" + jsondata.Email + "','" + jsondata.SignUpTime + "');", function(err, result) {
    if (err) {
     data.push({
      Message: "User Creation Failed"
     });
     console.log("error" + err);
    } else {

     dbClient.query("SELECT UsrId FROM EndUser WHERE Email LIKE '" + jsondata.Email + "';", function(err, result) {
      if (err) {
       data.push({
        Message: "User Creation Failed"
       });
       console.log("errorselect" + err);
      } else {
       var userid = result[0].UsrId;
       console.log("userid" + userid);

       dbClient.query("INSERT INTO dbBh.Log_In(Email,Password,UsrId)values('" + jsondata.Email + "','" + jsondata.Password + "'," + userid + ");", function(err, result) {
        if (err) {
         data.push({
          Message: "User Creation Failed"
         });
         console.log(err);
        } else {
            data.push({
                Message: "User Created Successfully",
                UserId: userid
               });
               console.log("jsondata" + data);
               res.send(JSON.stringify(data));
        }
       });
      }
     });
    }
   });
  } catch (error) {
   console.log(error)
  }
 });

 /*API to get User Details */
 app.post('/getuserdetails', (req, res) => {
  var jsondata = req.body;
  var data = [];
  dbClient.query("SELECT * FROM EndUser WHERE UsrId = " + jsondata.UserId + ";", function(err, result, fields) {
   if (err) {
    response.push({
     Message: "Invalid UserId"
    });
   } else {

    for (var i = 0; i < result.length; i++) {
     data.push({
      UserId: result[i].UsrId,
      FName: result[i].FName,
      LName: result[i].LName,
      CompanyId: result[i].OrganizationId,
      RoleId: result[i].RoleId,
      Email: result[i].Email,
      SignUpTime: result[i].SignUpTime
     });
    }
    response.push(data);
   }
   res.send(JSON.stringify(response));
  });
 });
});