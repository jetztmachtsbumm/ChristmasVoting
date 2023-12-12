const fs = require('fs')
const express = require('express')
const app = express()

app.use(express.static('public'))
app.use(express.json())

const userDataBaseFilePath = 'db/users.json'
const activitiesDatabaseFilePath = 'db/activities.json'
const userVotesDatabaseFilePath = 'db/userVotes.json'

let activities = {}
let userVotes = {}

loadActivitiesFromDatabase()
loadUserVotesFromDatabase()

app.post('/login', async(req, res) => {
    let jsonData = req.body
    const username = jsonData['username']
    const password = jsonData['password']

    await fs.readFile(userDataBaseFilePath, 'utf8', (err, fileData) => {
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

    await fs.readFile(userDataBaseFilePath, 'utf8', (err, fileData) => {
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
        id: Object.getOwnPropertyNames(activities).length,
        description: jsonData['description'],
        author: jsonData['author'],
        votingScore: 0
    }

    activities[newActivity['id']] = newActivity

    if(!await writeJsonToFile(activitiesDatabaseFilePath, activities)){
        res.sendStatus(200)
    }else{
        res.sendStatus(500)
    }
})

app.post('/try-vote', async (req, res) => {
    const jsonData = req.body

    let userVoteData;
    if(userVotes[jsonData['username']] === undefined){
        userVoteData = {
            1: undefined,
            2: undefined,
            3: undefined
        }
    }else{
        userVoteData = userVotes[jsonData['username']]
    }

    for(const key in userVoteData){
        if(userVoteData[key] === Number(jsonData['activityId'])){
            res.sendStatus(401)
            return
        }
    }

    if(userVoteData[Number(jsonData['votingScore'])] !== undefined){
        activities[userVoteData[Number(jsonData['votingScore'])]]['votingScore'] -= Number(jsonData['votingScore']) 
    }

    userVoteData[jsonData['votingScore']] = jsonData['activityId']

    userVotes[jsonData['username']] = userVoteData

    activities[jsonData['activityId']]['votingScore'] += Number(jsonData['votingScore'])

    await writeJsonToFile(userVotesDatabaseFilePath, userVotes)
    await writeJsonToFile(activitiesDatabaseFilePath, activities)

    res.sendStatus(200)
})

app.post('/get-votes', async (req, res) => {
    const username = req.body['username']

    res.json(userVotes[username])
})

app.get('/get-activities', async (_req, res) => {
    res.status(200).json(activities)
})

function checkUserDataExists(existingData, newData){
    return existingData[newData['username']] !== undefined
}

function checkPassword(username, password, fileData){
    return username !== undefined && password !== undefined && fileData[username] === password
}

async function writeJsonToFile(dataBaseFilePath, jsonData){
    await fs.writeFile(dataBaseFilePath, JSON.stringify(jsonData, null, 2), 'utf8', (writeError) => {
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

function loadUserVotesFromDatabase(){
    fs.readFile(userVotesDatabaseFilePath, (err, fileData) => {
        if(err){
            console.error('Error reading file:', err)
            return;
        }
    
        try{
            userVotes = JSON.parse(fileData)
        }catch(parseError){
            console.error('Error parsing existing JSON:', parseError)
        }
    })
}

app.listen(6969)