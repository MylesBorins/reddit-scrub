'use strict';
const RedditApi = require('reddit-oauth');
const async = require('async');

const config = require('./local.json');

const reddit = new RedditApi(config);

function login (cb) {
  reddit.passAuth(
    config.username,
    config.password,
    function (success) {
      return cb(success ? null : new Error('Failed to Login\t📛  '));
  });
}

function getComments(cb) {
  let uri = `/user/${config.username}/comments`;
  reddit.getListing(uri, null, (err, res, body, next) => {
    if (err) return cb(err);
    if (res.statusCode !== 200) {
      return cb(new Error(`Invalid res code: ${res.statusCode}`));
    }
    const ids = res.jsonData.data.children.map((thing) => {
      return thing.data.name;
    });
    console.log(`Fetched data for ${ids.length} comments`)
    return cb(null, ids);
  });
}

function deleteComment(id, cb) {
  reddit.post('/api/del', { id }, (err, res, body) => {
    if (err) return cb(err);
    if (res.statusCode !== 200) {
      return cb(new Error(`Invalid res code: ${res.statusCode}`));
    }
    console.log(`Deleted: ${id}`);
    return cb(null);
  });
}

function deleteComments(ids, cb) {
  async.each(ids, deleteComment, (err) => {
    console.log(`Deleted ${ids.length} comments`)
    getComments((err, comments) => {
      if (err) return cb(err);
      if (!comments.length) return cb(null);
      return deleteComments(comments, cb);
    });
  });
}

async.waterfall([
  login,
  getComments,
  deleteComments
], function (err) {
    if (err) {
      console.error(err);
      return;
    }
    console.log('Great Success\t✅');
});
