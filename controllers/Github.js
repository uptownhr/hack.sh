"use strict";

const router = require('express').Router(),
  Repo = require('../models/Repo'),
  Github = require('github-api')

router.use( (req,res,next) => {
  const user_token = req.user.providers.filter( prov => prov.name == 'github' )[0].accessToken
  const github = new Github({
    token: user_token,
    auth: 'oauth'
  })

  req.github = github
  next()
})

router.param('id', (req,res,next,id) => {
  Repo.findOne({_id: id}).then( repo => {
    req.repo = repo
    next()
  })
})

router.post('/hook', function(req,res){
  res.send(req.body)

})

router.get('/repos', hasRepos, function(req,res){
  console.log(req.user._id)
  Repo.find({_user: req.user._id})
  .then( repos => {
    res.render( 'repo/list', {repos} )
  } )

})

router.get('/repo/:id/activate', createRepoHook, function(req, res, next){
  req.repo.activated = true

  req.repo.save( next )
}, function(req,res){
  res.redirect('/github/repos')
})

router.get('/repo/:id/deactivate', disableRepoHook, function(req, res, next){
  req.repo.activated = false

  req.repo.save( next )
}, function(req,res){
  res.redirect('/github/repos')
})

function disableRepoHook(req, res, next){
  console.log('removing repo hook', req.repo)
  let repo = req.repo
  const g_repo = req.github.getRepo(repo.owner, repo.name)
  g_repo.editHook(repo.github.hook_id, {
    active: false
  },function(err, hook){
    if(err) return next(err)
    next()
  })
}

function createRepoHook(req, res, next){
  let repo = req.repo
  const g_repo = req.github.getRepo(repo.owner, repo.name);

  g_repo.createHook({
    name: 'web',
    active: true,
    events: ['push'],
    config: {
      url: "http://hack.sh/hook/github/push",
      content_type: "json"
    }
  }, function(err, hook){
    if(err) return next(err)

    repo.github.hook_id = hook.id
    next(err)
  })
}

function hasRepos(req, res, next){
  if(req.user.github.repos_synced) return next()
  const g_user = req.github.getUser();

  g_user.repos( (err, repos) => {
    const mappedRepo = repos.map( repo => {
      return{
        id: repo.id,
        name: repo.name,
        owner: repo.owner.login,
        full_name: repo.full_name,
        _user: req.user._id
      }
    })

    Repo.collection.insert(mappedRepo, function(err, docs){
      req.user.github.repos_synced = true
      req.user.save().then( saved => next())
    })
  });
}

module.exports = router