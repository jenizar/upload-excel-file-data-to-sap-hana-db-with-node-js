//use path module
const path = require('path');
var http = require('http');
var fs = require('fs');
var formidable = require('formidable');
const hbs = require('hbs');
//use bodyParser middleware
const bodyParser = require('body-parser');
const xlsx = require("xlsx");
//use express module
const express = require('express');
const app = express();
//const session = require('express-session'); 
//use sap hanadb database
var hana = require('@sap/hana-client');
var conn = hana.createConnection();
var conn_params = {
  serverNode  : '4b25c31e-9856-4586-a8d0-b1caa0f89c02.hana.trial-us10.hanacloud.ondemand.com:443',
  uid         : 'DBADMIN',
  pwd         : 'MyHanadb911_'
};

//set views file
app.set('views', path.join(__dirname, 'views'));
//set view engine
app.set('view engine', 'hbs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
//set folder public as static folder for static file
app.use('/assets', express.static(__dirname + '/public'));

//route for homepage
app.get('/', (req, res) => {
   conn.connect(conn_params, function(err) {
     conn.exec('SELECT * FROM EXCEL.DRUG ORDER BY DRUG_NAME',  function (err, results) {
      conn.exec('SELECT COUNT(*) AS tdata FROM EXCEL.DRUG',  function (err, dbrecords) {
        if (err) throw err;           
         totaldata = dbrecords[0].TDATA;          
        res.render('drug_view', {
            results: results,
            dbrecords: totaldata 
        }); 
      });
      });   
    });    
  });

//route for upload data
app.post('/upload', (req, res) => {
   var form = new formidable.IncomingForm();
  const fs = require('fs');  
  const path = require('path');
  const directoryPath = '/home/jenizar/Documents/datasets/drug/';
  //form.uploadDir = 'datasets/';
  //form.uploadDir = path.join(__dirname, 'datasets/');
  form.keepExtensions = true;
  form.parse(req, function(err, fields, files) {
    var file_name = JSON.stringify(files.upload[0].originalFilename);
    console.log(files);
    console.log(fields);
   file_name = file_name.replace(/^"(.*)"$/, '$1');
   console.log(file_name); 
   const file_path = directoryPath + file_name;
   const workbook = xlsx.readFile(file_path);
   console.log(file_path);
   const sheetnames = workbook.SheetNames[0];
   data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetnames]);
   const obj = JSON.stringify(data);
   let jsonData = JSON.parse(obj);
   console.log(data);
   console.log(obj);
     var count = Object.keys(jsonData).length;
     let key;
     let drug_name;
     let dose;
     let price;
    for (let i = 0; i < count; i++) {
     for (const key in jsonData[i]) {
       if (key == 'drug_name') {
        drug_name = jsonData[i][key];
      }
      else if (key == 'dose') {
        dose = jsonData[i][key];
      }
      else if (key == 'price') {
        price = jsonData[i][key];
        price = price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); //thousand separator
      }
     } 
     console.log(drug_name, dose, price); 
     let sql = "INSERT INTO EXCEL.DRUG(DRUG_NAME, DOSE, PRICE) VALUES ('"+drug_name+"', '"+dose+"', '"+price+"')";
     let query = conn.exec(sql, (err, results) => {      
         if (err) throw err;

     });
    }           
        res.redirect('/');
      });
});

//server listening
const port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("Server is running at port " + port);
});    
