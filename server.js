const fs = require('fs')
const express = require('express')
const app = express()

app.use(express.static('public'))
app.use(express.json())

app.post('/', async(req, res) => {
    let jsonData = req.body
    const username = jsonData['username']
    const password = jsonData['password']

    const filePath = 'db/users.json'

    fs.readFile(filePath, 'utf8', (err, fileData) => {
        if(err){
            console.error('Error reading file:', err)
            res.status(500).send('Internal Server Error')
            return;
        }

        let existingData;
        try{
            existingData = JSON.parse(fileData)
        }catch(parseError){
            console.error('Error parsing existing JSON:', parseError)
            res.status(500).send('Internal Server Error')
            return
        }

        jsonData = {}
        jsonData[username] = password

        const dataExists = checkDataExists(existingData, jsonData)

        if(dataExists){
            const correctPassword = checkPassword(jsonData['password'], existingData)
            if(correctPassword){
                res.redirect('/voting.html')
            }
            return
        }

        
        const updatedData = {...existingData, ...jsonData}

        const jsonString = JSON.stringify(updatedData, null, 2)

        fs.writeFile(filePath, jsonString, 'utf8', (writeError) => {
            if(writeError){
                console.error('Error writing JSON to file:', writeError)
                res.status(500).send('Internal Server Error')
            }else{
                res.status(200)
                res.redirect('/voting.html')
            }
        })
    })
})

function checkDataExists(existingData, newData){
    return existingData.hasOwnProperty(newData['username'])
}

function checkPassword(password, fileData){
    return fileData['username'] === password
}

app.listen(6969)