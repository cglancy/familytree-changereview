(function () {
  'use strict';
  angular.module('fsReferenceClient', [
    'ngAnimate',
    'fsReferenceClientShared',
    'firebase',
    'infinite-scroll',
    'templates-app',
    'templates-common',
    'ui.bootstrap',
    'ui.router.state',
    'ui.router'
  ])
    .constant('FIREBASE_URL', 'https://shining-heat-1351.firebaseio.com/sandbox')
    .constant('FS_URL', 'https://sandbox.familysearch.org')
    
    .config(function($stateProvider, $urlRouterProvider) {
      $urlRouterProvider.otherwise('/');
    })

    .config(function(fsApiProvider) {
      fsApiProvider
        //.setClientId('a0T3000000BMRakEAH')
        .setClientId('WCQY-7J1Q-GKVV-7DNM-SQ5M-9Q5H-JX3H-CMJK')
        .setEnvironmentName('sandbox')
        //.setRedirectUri('http://peertrees.com/auth.html');
        .setRedirectUri('http://localhost:9000/#!/auth');
    })

    .config(function(ftrLocationProvider) {
      var prefix = '/#';
      ftrLocationProvider.configure({
        getPersonLocation: function(personId) {
          return {
            prefix: prefix,
            path: '/person/'+personId
          };
        },
        getUserLocation: function(userId) {
          return {
            prefix: prefix,
            path: '/user/'+userId
          };
        },
        getCoupleLocation: function(coupleId) {
          return {
            prefix: prefix,
            path: '/couple/'+coupleId
          };
        },
        getParentsLocation: function(parentsId) {
          return {
            prefix: prefix,
            path: '/parents/' + parentsId
          };
        }
      });
    })

    .run(function () {
    })

    .controller('AppController', function ($scope) {
      
      $scope.pageTitle = 'PeerTrees';
      $scope.environment = 'Sandbox';
      //$scope.environment = 'Beta';

      // $scope.$on('newSession', function() {
      //   fsCurrentUserCache.getUser().then(function(user) {
      //     $scope.loggedInStatus = 'Logged in as ' + user.displayName;
      //   });
      // });

      // don't forget to edit index.html to add {Track:js} script on demo

      $scope.$on('$stateChangeStart', function(event, toState) {
        if (toState.resolve) {
          $scope.busy = true;
        }
      });
      $scope.$on('$stateChangeSuccess', function() {
        $scope.busy = false;
      });
      $scope.$on('$stateChangeError', function() {
        $scope.busy = false;
      });

    });

})();
