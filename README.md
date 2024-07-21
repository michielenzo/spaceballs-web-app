## spaceballs-web-app

Run locally:  
`npm start`

Deploy for production with Docker:

1. Build the image  
`docker build -t spaceballs-web-app .`
2. Run the image inside a container
` docker run -p 80:80 -p 443:443 -d --name spaceballs-web-app-container spaceballs-web-app`
The -d flag is used to run it as a daemon. Port 80 is the main entrance of your domain. 
Port 443 is the ssl port.

Or deploy with docker compose:
`docker compose up -d`
The -d flag is used to run it as a daemon.

### CC0 Attribution

Powerup 06.wav by MATRIXXX_ -- https://freesound.org/s/523650/ -- License: Creative Commons 0
Powerup 07.wav by MATRIXXX_ -- https://freesound.org/s/523649/ -- License: Creative Commons 0
Powerup 10.wav by MATRIXXX_ -- https://freesound.org/s/523654/ -- License: Creative Commons 0
Man Dying by Under7dude -- https://freesound.org/s/163442/ -- License: Creative Commons 0