(function(){
  'use strict';
  angular.module('fsReferenceClient')
  .config(function ($stateProvider) {
    $stateProvider.state('login', {
      url: '/',
      controller: 'LoginController',
      templateUrl: 'login/login.tpl.html',
      data: { pageTitle: 'Login' }
    });
  })
  .controller('LoginController', function ($scope, $state, $rootScope, fsApi, fsCurrentUserCache, $window) {
    $scope.signIn = function() {
      fsApi.getAccessToken().then(function() {
        $rootScope.$emit('newSession');
        $state.go('home');

        fsCurrentUserCache.getUser().then(function(user) {
          $rootScope.loggedInStatus = 'Logged in as ' + user.displayName;

          var email = '';
          var password = user.id;

          if (user.email.length) {
            email = user.email;
          }

          console.log('Attempting to authenticate with email =' + email);

          var ref = new $window.Firebase('https://shining-heat-1351.firebaseio.com');
          ref.authWithPassword({
            email    : email,
            password : password
          }, function(error) {
            if (error) {
              console.log('Login Failed!', error);

              ref.createUser({
                email    : email,
                password : password
              }, function(error) {
                if (error === null) {
                  console.log('User created successfully');

                  ref.authWithPassword({
                    email    : email,
                    password : password
                  }, function(error) {
                    if (error) {
                      console.log('Login Failed!', error);
                    } else {
                      console.log('Authenticated successfully');
                    }
                  });
                } else {
                  console.log('Error creating user:', error);
                }
              });
            } else {
              console.log('Authenticated successfully');
            }          
          });        
        });
      });
    };
  });
})();
