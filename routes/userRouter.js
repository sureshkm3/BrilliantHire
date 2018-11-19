var express = require('express');

//this is for hashing the password instead of storing it as plaintext in db 
var bcrypt = require('bcrypt');

//using promise enable mysql package 
var mysql = require('promise-mysql');


//use a db connection pool to parallel process and also handle the acquiring and destroying of connection 
var dbClient = mysql.createPool({
        connectionLimit: 10,
        host: '127.0.0.1',
        database: 'brillianthire',
        user: 'root',
        password: 'admin',
        debug: false
});

  //using promises instead of callback functions for better readability 

var routes = function (logger) {
        var userRouter = express.Router();
        //changing the api name to indicate clear use of it   
        userRouter.route('/validateUser').post(function (req, res) {

                //validating the input 
                validateInput(req, false);
                var errors = req.validationErrors();
                if (errors) {
                        res.status(400).send(errors);
                        return;
                }
                var jsondata = req.body;
                logger.info("validate request recieved for:" + jsondata.Email);
                //removing logging of password which is a sensitive field

                validateUser(jsondata, logger, res);


        });

        userRouter.route('/createUser').post(function (req, res) {
                //doing all the validations 
                validateInput(req, true);
                var errors = req.validationErrors();
                if (errors) {
                        res.status(400).send(errors);
                        return;
                }
                var jsondata = req.body;
                var data = [];
                var usrId;
                logger.info("Received a user create request with email:" + jsondata.Email);

                dbClient.query("INSERT INTO EndUser(FName,LName,OrganizationId,RoleId,Email,SignUpTime)values('" + jsondata.FName + "','" + jsondata.LName + "'," + jsondata.CompanyId + "," + jsondata.RoleId + ",'" + jsondata.Email + "','" + jsondata.SignUpTime + "');")
                        .then(function (result) {
                                usrId = result.insertId
                                if (!usrId) {
                                        data.push({
                                                Message: "User Creation Failed"
                                        });
                                        logger.error("error occured while creating user for email id:" + jsondata.Email)
                                        res.status(500).send(JSON.stringify(data));
                                } else {
                                        let password = bcrypt.hashSync(jsondata.Password, 10);
                                        return dbClient.query("INSERT INTO Log_In(Email,Password,UsrId)values('" + jsondata.Email + "','" + password + "'," + usrId + ");");
                                }
                                return false;
                        })
                        .then(function (result) {
                                data.push({
                                        Message: "User Created Successfully",
                                        UserId: usrId
                                });
                                logger.info("user created for email:" + jsondata.Email + "User Id:" + usrId);
                                res.status(201).send(JSON.stringify(data));
                        })
                        .catch(function (err) {
                                data.push({
                                        Message: "User Creation Failed"
                                });
                                logger.error("error occured while creating user for email id:" + jsondata.Email);
                                res.status(500).send(JSON.stringify(data));
                        });
        });

        userRouter.route('/getuserdetails').post(function (req, res) {
                req.checkBody("UserId", "Enter a valid userID.").notEmpty();
                var errors = req.validationErrors();
                if (errors) {
                        res.status(400).send(errors);
                        return;
                }
                var jsondata = req.body;
                var data = [];
                dbClient.query("SELECT * FROM EndUser WHERE UsrId = " + jsondata.UserId + ";")
                        .then(function (results) {
                                if (results.length == 0) {
                                        data.push({
                                                Message: "User not found"
                                        });
                                        res.status(204).send(JSON.stringify(data));
                                } else {
                                        data.push({
                                                UserId: results[0].UsrId,
                                                FName: results[0].FName,
                                                LName: results[0].LName,
                                                CompanyId: results[0].OrganizationId,
                                                RoleId: results[0].RoleId,
                                                Email: results[0].Email,
                                                SignUpTime: results[0].SignUpTime
                                        });
                                        res.status(200).send(JSON.stringify(data));
                                }
                        })
                        .catch(function (err) {
                                data.push({
                                        Message: "User retrieval Failed"
                                });
                                res.status(500).send(JSON.stringify(data));
                        });
        });

        return userRouter;
};
var validateUser = function (jsondata, logger, res) {
        var data = [];
        var userId;

      
        //changing the query to directly check instead of using  like 
        dbClient.query("SELECT UsrId from Log_In where Email ='" + jsondata.Email + "';")
                .then(function (result) {
                        if (result[0] !== undefined) {
                                userId = result[0].UsrId;
                                return dbClient.query("SELECT EndUser.* , Organization.Name as Company,MapRole.RoleName as Role,Log_In.Password as Password FROM EndUser INNER JOIN Organization ON EndUser.OrganizationId = Organization.OrganizationId INNER JOIN MapRole ON EndUser.RoleId = MapRole.RoleId  INNER JOIN Log_In ON Log_In.UsrId = EndUser.UsrId WHERE EndUser.UsrId =" + userId + ";")
                        } else {
                                data.push({
                                        Message: "Invalid Credentials",
                                        StatusCode: 401
                                });

                                throw "Invalid user details";
                        }
                })
                .then(function (result) {
                                logger.info("user details length:" + result.length);
                                if (result.length > 1) {
                                        data.push({
                                                Message: "Error occured ",
                                                StatusCode: 500
                                        });

                                        logger.error("Multiple entries present for user:" + userId);
                                        throw "Multiple entries present for user:";
                                } else {
                                        // comparing the hashed password instead of plaintext
                                        bcrypt.compare(jsondata.Password, result[0].Password).then(function (isSame) {
                                                if (isSame) {
                                                        data.push({
                                                                UserId: result[0].UsrId,
                                                                FName: result[0].FName,
                                                                LName: result[0].LName,
                                                                OrganizationId: result[0].OrganizationId,
                                                                RoleId: result[0].RoleId,
                                                                Email: result[0].Email,
                                                                SignUpTime: result[0].SignUpTime,
                                                                Organization: result[0].Company,
                                                                Role: result[0].Role,
                                                                StatusCode: 200
                                                        });
                                                        logger.info("User details for user:" + result[0].userId + " retrieved sucessfully");
                                                        res.status(data[0].StatusCode).send(JSON.stringify(data));
                                                } else {
                                                        data.push({
                                                                StatusCode: 401,
                                                                Message: "Invalid Credentials"
                                                        });

                                                        throw "Invalid user details";


                                                }
                                        })
                                }
                       }
                )
                .catch(function (err) {
                        console.log("error occured :" + err);
                        res.status(data[0].StatusCode).send(JSON.stringify(data));
                });


}
module.exports = routes;

var validateInput = function (req, isCreate) {
        //doing the basic validation any new validation can be added here 
        req.checkBody("Email", "Enter a valid email address.").isEmail();
        req.checkBody("Password", "Enter a valid password").notEmpty();

        if (isCreate) {
                req.checkBody("FName", "Enter a valid first name").notEmpty();
                req.checkBody("LName", "Please enter a valid last name").notEmpty();
                req.checkBody("RoleId", "Please enter a valid companyID").notEmpty();
                req.checkBody("CompanyId", "Please enter a valid companyID").notEmpty();
                req.checkBody("SignUpTime", "Sign up time is empty").notEmpty();
        }

}