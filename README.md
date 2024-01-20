## michielidemawebsite

Run locally:  
`npm start`

Deploy for production with Docker:

1. Build the image  
`docker build -t michielidema-website .`
2. Run the image inside a container  
`docker run -d -p 3000:3000 --name michielidema-website-container michielidema-website`  
Port 3000 of the container is linked to port 3000 of the hosting server.   
The -d flag is used to run it as a daemon.