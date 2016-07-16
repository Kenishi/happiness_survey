# Happiness Survey Challenge

## Instructions
1. Clone the repo
2. Install [Node.JS](https://nodejs.org/en/download/), LTS or latest should both be fine.
3. Run `npm install` in the repo folder's root, this will pull down the required dependencies needed to run the application.
4. After npm has finished, run `npm start`
5. If everything goes well you should see the text: `Listening on port: 3000`
6. Visit `http://localhost:3000` to try out the Happiness Survey
7. If you want to try the single unit test, run `npm test`
8. To stop the server: CTRL+C

Survey should run fine on most recent versions Chrome and Firefox, IE/Edge have not been tested.

There is a tool in the Admin tab on the survey to generate random data. This incidentally will generate random timestamps as well ranging from 0 ~ Current Epoch, so the graphs plotted by time will be all over the place.

If you stop and restart the server while on the page, the socket.io client connection can sometimes have trouble reconnecting if it tries reconnecting while the Socket.io server is in the process of starting back up again. Simply refreshing the page should clear this up.

## Libraries used
### Backend

* NodeJS
* ExpressJS
* [Jade](http://jade-lang.com/) - for HTML templating engine
* [Socket.io](http://socket.io/) - for real time updating to all clients and easier message exchange
* Sqlite3 - for a small simple database
* [lodash](https://lodash.com/) - for some simple functional style data processing
* [winston](https://github.com/winstonjs/winston) - logging, which there should be little of
* [mocha](https://mochajs.org) - for testing
* [should](http://shouldjs.github.io) - for assertion checking in testing

### Frontend
* [Bootstrap](http://getbootstrap.com) - for quick easy layout and styling
* [KnockoutJS](http://knockoutjs.com) - for quick data binding
* [CanvasJS](http://http://canvasjs.com/) - for quick and easy charts
* JQuery
* [Sweet Alerts for Bootstrap](http://lipis.github.io/bootstrap-sweetalert/) - for nicer popup notifications

## Some Notes

### Why no Vue.js?

After looking at the docs I noticed its pretty similar to React.JS but because I wanted to try using D3 in the code I knew I couldn't try getting two unfamiliar libraries working at the same time. So I opted to go with something I knew I could get working, KnockoutJS.

### Why no D3?

After getting most of the form setup, I actually did try doing a couple of the charts in D3 but was having a hard time getting them to work. After spending a few hours on it I decided to try CanvasJS and get something working at the very least. If I had more time to mess around, I could get D3 working I'm sure.

## Problem Areas/Things to Change

* If you shut down the server and restart it while on the page, the client socket.io connection sometimes acts up and won't reconnect properly. Generally, a refresh will clear this up.

* When a client adds a new submission it causes the entire model to update with the same data. A better method would be to perform a delta change of some sort to avoid excessive data
transmission.

* There isn't any validation or sanitation on the submission data.

* Processing of data is handled within the SocketHandler. This is poor coupling and would be
better suited in a class of its own.

* There is some inefficiency in processing some of the data in the processData() function. Ex: Calculating the avg happy score for each gender could probably be optimized to save a few cycles. Also some of the calculations could probably be set up to use a prior reduced set of a data instead of doing it over again.

* The calculation for avg happy scores doesn't take into account integer overflow.

* The Age and Gender one could theoretically be improved to allow for customizable bins, though some changes would probably have to be made on the back end to allow for that level of customization on a per user basis.

* Maybe refactor some of the backend code to make use of ES6. 