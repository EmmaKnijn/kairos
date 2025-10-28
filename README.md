# 🚆Kairos
Kairos is a public transport information platform. It currently consists of a few components.
*note* As this is a project developed by me for uni, no support / updates are guaranteed. 

## Components
### Rendering API
This renders the public transport information for a 128x64 dot matrix display intended to be hanged under existing platform signage.
### GoTrain
We are using GoTrain to receive the public transport information and provide it over REST, see more at [this repository](https://github.com/rijdendetreinen/gotrain)

## Deployment
Deployment is easiest using Docker, use the provided docker-compose.yml file as a base for your configuration.
*note:* It may take some time for the Rendering API to start working as GoTrain needs to receive messages.