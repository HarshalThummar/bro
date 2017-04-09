\rm -fr lambda_upload.zip
zip -r lambda_upload.zip index.js bro_db.json node_modules
aws lambda update-function-code --function-name broLookup --zip-file fileb://lambda_upload.zip