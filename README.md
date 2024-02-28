# FinalBack
# NBA official data WEB App

## Description
(Admin name: AbayAdmin
Password: 2323)

This site about NBA data where users can look for their favorite team and player, to get to know them better.
Users can access a variety of features, including searching for NBA players, retrieving detailed information about specific teams.

## Technologies Used

- **Node.js**: The backend of the application is powered by Node.js, providing a robust and scalable server environment.

- **Express.js**: As a web application framework for Node.js, Express.js facilitates the creation of RESTful APIs and handling of HTTP requests.

- **MongoDB Atlas**: The application uses MongoDB as its database, and data is stored in the cloud using MongoDB Atlas. MongoDB is a NoSQL database, providing flexibility in managing structured and unstructured data.

- **Mongoose**: Mongoose is an Object Data Modeling (ODM) library for MongoDB and Node.js. It simplifies interactions with the MongoDB database and provides schema validation.

- **JWT (JSON Web Tokens)**: Authentication in the application is implemented using JWT to securely transmit information between parties.

- **Bootstrap**: The front-end design is enhanced using Bootstrap, a popular CSS framework, to ensure a responsive and visually appealing user interface.

- **EJS (Embedded JavaScript)**: EJS is used as the templating engine for rendering dynamic content in the views.

- **Axios**: Axios is a promise-based HTTP client used for making requests to external APIs, such as the Balldontlie API for NBA data.

- **bcrypt**: To securely hash and store user passwords in the database, the bcrypt library is utilized.

## Features

- **User Authentication**: Users can sign up, log in, and log out securely. Authentication is implemented using JWT, providing a secure and token-based authentication system.

- **NBA Team Information**: Users can retrieve detailed information about NBA teams by entering the team ID.

- **NBA Player Search**: Users can search for NBA players by providing the first name and/or last name.

- **Admin Panel**: Admin users have access to an admin panel where they can manage user accounts, including editing and deleting user information.

- **Dynamic Image Carousel**: The homepage features a dynamic image carousel, with image URLs fetched from an external source and displayed dynamically.


# Install dependencies
npm install
