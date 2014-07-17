SF Transit
==========

### About

An interactive map of San Francisco that displays the realtime positions of SF Muni busses and trains. The app uses data from the NextBus api [http://www.nextbus.com/xmlFeedDocs/NextBusXMLFeed.pdf] to display transit routes and vehicle positions.

### Built with

- d3.js (data visualization)
- jQuery (ui / dom)
- Boostrap (front-end framework)
- npm (dependency management)
- Browserify / Watchify (node.js style requires for client)

### Running your own instance of this repo

1. Clone repo
2. npm install
3. nodemon server.js
4. watchify app.js -o bundle.js (from root/js)
