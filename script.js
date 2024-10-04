var message = ``
var loader = document.querySelector("#loading");
var storyBoard = document.querySelector("#story_board");
function buildInterests() {
    let sentence = "They enjoy "
    let interestList = document.querySelectorAll(".check_input");
    for (let interest of interestList) {
        if (interest.checked) {
            sentence += interest.value + ", "
        }
    }
    sentence = sentence.slice(0, -2);
    sentence += "."
    return sentence
}
function getInfo(zip, fullName) {
    loader.innerHTML += "<h1>Getting todays forecast...</h1>"
    zip = zip.value;
    fullName = fullName.value;
    let interestStatement = buildInterests();
    var myHeaders = new Headers();
    myHeaders.append("X-RapidAPI-Key", YOUR_KEY_HERE);
    myHeaders.append("X-RapidAPI-Host", "us-weather-by-zip-code.p.rapidapi.com");

    var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };
    fetch(`https://us-weather-by-zip-code.p.rapidapi.com/getweatherzipcode?zip=${zip}`, requestOptions)
        .then(response => response.json())
        .then(result => {
            console.log(result)
            message = `There is a person named ${fullName}, living in ${result.City},${result.State}.${interestStatement} Todays forecast is ${result.Weather}, and it is ${result.TempF}F degrees outside. The wind is blowing ${result.WindDir} at ${result.WindMPH}. Write me a short story, three paragraphs max, about what the rest of the day will bring. Do not make up pet names. Think of a few things to do in the area mentioned. The last sentence should always be a visual description of the highlight of the day.`
            console.log("PROMPT: " + message)
            sendChat();
        })
        .catch(error => console.log('error', error));
}

var myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");
myHeaders.append("Authorization", YOUR_KEY_HERE);
myHeaders.append("Cookie", "__cf_bm=VBXkb3XjGmpSu9OY2xnOLWRfcC.VuQfWRdDj7oM35Sk-1700175653-0-ATo9WAWmzRXT95YqiCiOidM5X+bE9LOYRaGUh6CywzqdPKmNzGxSO6WCq/ZlswT41jDTQXaMCdcqKEyQGSxzPSk=; _cfuvid=Qrb2jT820jJSVCcfFuqgCICzbf8Rg8uIPn.__rlD5T4-1700174420940-0-604800000");

let story = ``;
function sendChat() {
    loader.innerHTML += "<h1>Writing todays story...</h1>"
    let messages = [{
        "role": "user",
        "content": message
    }]
    var raw = JSON.stringify({
        "model": "gpt-3.5-turbo",
        "messages": messages,
        "temperature": 0.7
    });
    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };
    fetch("https://api.openai.com/v1/chat/completions", requestOptions)
        .then(response => response.json())
        .then(result => {
            story = result.choices[0].message.content;
            console.log("Story: " + story);
            getImage(story);
            getVoice(story);
        })
        .catch(error => console.log('error', error));
}

function getImage(s) {
    loader.innerHTML += "<h1>Generating an image...</h1>"
    console.log("making image")
    let image = document.querySelector("#auto_img");
    let storyP = document.querySelector("#story");
    var url = "https://api.openai.com/v1/images/generations";
    let concatPrompt = s + "Create a collage of the events. Do not include text in the image. Focus more on the surroundings. Avoid close ups or portraits." + description;
    console.log(concatPrompt)
    fetch(url, {
        method: 'POST',
        headers: myHeaders,
        body: JSON.stringify({
            "prompt":  concatPrompt,
            "model": "dall-e-3",
        })
    }).then(response => {
        return response.json()
    }).then(data => {
        console.log(data.data[0].url)
        storyP.innerText = s;
        image.src = data.data[0].url;
        loader.innerText = ""
        storyBoard.classList.remove("hide")
        playBack();
    })
        .catch(error => {
            console.log('Something bad happened ' + error)
        });
}

let ctx;
let audio;
let playSound;

function getVoice(s) {
    let voiceSelection = document.querySelector("#narrate").value;
    console.log('Getting voice')
    ctx = new AudioContext();
    var url = "https://api.openai.com/v1/audio/speech";
    fetch(url, {
        method: 'POST',
        headers: myHeaders,
        body: JSON.stringify({
            "model": "tts-1",
            "input": s,
            "voice": voiceSelection
        })
    })
    .then(response => {
            loader.innerHTML += "<h1>Hiring Narrator...</h1>"
            console.log("Got voice")
            return response
        })
        .then(data => {
            return data.arrayBuffer()
        })
        .then(arrayBuffer => ctx.decodeAudioData(arrayBuffer))
        .then(decodedAudio => {
            audio = decodedAudio;
        })
        .catch(error => {
            console.log('Something bad happened ' + error)
        });
}
var imageUpload = document.querySelector("#img_upload")
var reader;
function encodeImageFileAsURL(element) {
    var file = element.files[0];
    reader = new FileReader();
    reader.onloadend = function () {
        console.log(reader.result);
        imageUpload.src = reader.result
    }
    reader.readAsDataURL(file);
}

function playBack() {
    playSound = ctx.createBufferSource();
    playSound.buffer = audio;
    playSound.connect(ctx.destination);
    playSound.start(ctx.currentTime);
}
function playBackStop() {
    playSound.stop(ctx.currentTime)
}


let description = "";
function getDescription(zip, fullName) {
    if(!reader){
        console.log("Please select an image");
        return
    }
    console.log("creating description from image")
    loader.innerHTML += "<h1>Describing your face to the ai...</h1>"
    storyBoard.classList.add("hide");
    var raw = JSON.stringify({
        model: "gpt-4-vision-preview",
        max_tokens: 300,
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: "Please provide a few sentences to describe in detail the physical traits of the person in the photo. General things like hair color, age, body type, and complextion for example. Do not include any details about the surroundings or the pose. The types of details you would give a sketch artist. Do not mention you are an AI model." },
                    {
                        type: "image_url",
                        image_url: {
                            "url": reader.result,
                            "detail": "high"
                        },
                    },
                ],
            },
        ],
    });
    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };
    fetch("https://api.openai.com/v1/chat/completions", requestOptions)
        .then(response => response.json())
        .then(result => {
            console.log(result.choices[0].message.content)
            description = result.choices[0].message.content
            console.log("Got description")
            getInfo(zip, fullName);
        })
        .catch(error => console.log('error', error));
}
function startNew(){
    window.location.reload();
    window.scrollTo(0, 0);
}




