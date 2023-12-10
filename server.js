const fs = require('fs')
const express = require('express')
const app = express()

app.use(express.static('public'))
app.use(express.json())

const dataBaseFilePath = 'db/users.json'

app.post('/login', async(req, res) => {
    let jsonData = req.body
    const username = jsonData['username']
    const password = jsonData['password']

    fs.readFile(dataBaseFilePath, 'utf8', (err, fileData) => {
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

        const dataExists = checkDataExists(existingData, jsonData)

        if(dataExists){
            const correctPassword = checkPassword(username, password, existingData)
            if(correctPassword){
                res.redirect('/voting.html')
            }else{
                res.status(401).send('Incorrect Password')
            }
            return
        }

        jsonData = {}
        jsonData[username] = password
        
        const updatedData = {...existingData, ...jsonData}

        const jsonString = JSON.stringify(updatedData, null, 2)

        fs.writeFile(dataBaseFilePath, jsonString, 'utf8', (writeError) => {
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

app.post('/auth-voting', async (req, res) => {
    let jsonData = req.body
    const username = jsonData['username']
    const password = jsonData['password']

    fs.readFile(dataBaseFilePath, 'utf8', (err, fileData) => {
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

        const dataExists = checkDataExists(existingData, jsonData)

        if(dataExists){
            const correctPassword = checkPassword(username, password, existingData)
            if(!correctPassword){
                res.status(401).redirect('/')
            }
            return
        }else{
            res.status(401).redirect('/')
        }
    })
})

function checkDataExists(existingData, newData){
    return existingData[newData['username']] !== undefined
}

function checkPassword(username, password, fileData){
    return username !== undefined && password !== undefined && fileData[username] === password
}

app.listen(6969)