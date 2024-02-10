## michielidemawebsite

Run locally:  
`npm start`

Deploy for production with Docker:

1. Build the image  
`docker build -t michielidema-website .`
2. Run the image inside a container  
` docker run -p 80:80 -p 443:443 -d --name michielidema-website-container michielidema-website`
The -d flag is used to run it as a daemon. Port 80 is the main entrance of your domain. 
Port 443 is the ssl port.