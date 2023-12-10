const fs = require('fs')
const express = require('express')
const app = express()

app.use(express.static('public'))
app.use(express.json())

const userDataBaseFilePath = 'db/users.json'
const activitiesDatabaseFilePath = 'db/activities.json'

let activities = loadActivitiesFromDatabase()

app.post('/login', async(req, res) => {
    let jsonData = req.body
    const username = jsonData['username']
    const password = jsonData['password']

    fs.readFile(userDataBaseFilePath, 'utf8', (err, fileData) => {
        if(err){
            console.error('Error reading file:', err)
            res.sendStatus(500)
            return;
        }

        let existingData;
        try{
            existingData = JSON.parse(fileData)
        }catch(parseError){
            console.error('Error parsing existing JSON:', parseError)
            res.sendStatus(500)
            return
        }

        const dataExists = checkUserDataExists(existingData, jsonData)

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

        if(writeJsonToFile(userDataBaseFilePath, updatedData)){
            res.sendStatus(200)
            res.redirect('/voting.html')
        }else{
            res.sendStatus(500)
        }
    })
})

app.post('/auth-voting', async (req, res) => {
    let jsonData = req.body
    const username = jsonData['username']
    const password = jsonData['password']

    fs.readFile(userDataBaseFilePath, 'utf8', (err, fileData) => {
        if(err){
            console.error('Error reading file:', err)
            res.sendStatus(500)
            return;
        }

        let existingData;
        try{
            existingData = JSON.parse(fileData)
        }catch(parseError){
            console.error('Error parsing existing JSON:', parseError)
            res.sendStatus(500)
            return
        }

        const dataExists = checkUserDataExists(existingData, jsonData)

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

app.post('/submit-new-activity', async (req, res) => {
    const jsonData = req.body

    const newActivity = {
        description: jsonData['description'],
        author: jsonData['author'],
        votingScore: 0
    }

    activities[Object.getOwnPropertyNames(activities).length] = newActivity

    if(!writeJsonToFile(activitiesDatabaseFilePath, activities)){
        res.sendStatus(200)
    }else{
        res.sendStatus(500)
    }
})

app.get('/get-activities', async (req, res) => {
    res.status(200).json(activities)
})

function checkUserDataExists(existingData, newData){
    return existingData[newData['username']] !== undefined
}

function checkPassword(username, password, fileData){
    return username !== undefined && password !== undefined && fileData[username] === password
}

function writeJsonToFile(dataBaseFilePath, jsonData){
    fs.writeFile(dataBaseFilePath, JSON.stringify(jsonData, null, 2), 'utf8', (writeError) => {
        if(writeError){
            console.error('Error writing JSON to file:', writeError)
            return false
        }else{
            return true
        }
    })
}

function loadActivitiesFromDatabase(){
    fs.readFile(activitiesDatabaseFilePath, (err, fileData) => {
        if(err){
            console.error('Error reading file:', err)
            return;
        }
    
        try{
            activities = JSON.parse(fileData)
        }catch(parseError){
            console.error('Error parsing existing JSON:', parseError)
        }
    })
}

app.listen(6969)