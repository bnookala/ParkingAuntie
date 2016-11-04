var DocumentDBClient = require('documentdb').DocumentClient;
var async = require('async');

function DbActions(taskDao) {
  this.dbDao = taskDao;
}

module.exports = DbActions;

DbActions.prototype = {
    initQuestions: function (callback) {
        var self = this;

        var querySpec = {
            query: 'SELECT * FROM root r WHERE r.category=@question',
            parameters: [{
                name: '@question',
                value: 'Question'
            }]
        };

        self.dbDao.find(querySpec, function (err, items) {
            if (err) {
                throw (err);
            }

            callback(err, items)
        });
    },
	
	initAnswers: function (callback) {
        var self = this;

        var querySpec = {
            query: 'SELECT * FROM root r WHERE r.category=@answer',
            parameters: [{
                name: '@answer',
                value: 'Answer'
            }]
        };

        self.dbDao.find(querySpec, function (err, items) {
            if (err) {
                throw (err);
            }

            callback(err, items)
        });
    }

    
	
};