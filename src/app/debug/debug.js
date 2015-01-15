(function(){
  'use strict';
  angular.module('fsReferenceClient')
    .config(function ($stateProvider) {
      $stateProvider.state('debug', {
        url: '/debug',
        controller: 'DebugController',
        templateUrl: 'debug/debug.tpl.html',
        data: { pageTitle: 'Debug' }
      });
    })
    .controller('DebugController', function () {



    });
})();
