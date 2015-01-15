(function(){
  'use strict';
  angular.module('fsReferenceClientShared')
    .factory('ftcrCommentModal', function(_, $modal) {
      return {
        open: function() {
          return $modal.open({
            templateUrl: 'fsReferenceClientShared/ftcrCommentModal/ftcrCommentModal.tpl.html',
            size: 'lg',
            controller: function($scope) {
              $scope.commentText = '';

              $scope.hasComment = function() {
                if ($scope.commentText && $scope.length > 0) {
                  return true;
                }

                return false;
              };

              $scope.post = function() {
                $scope.$close($scope.commentText);
              };

              $scope.cancel = function() {
                $scope.$dismiss();
              };

            }
          }).result;
        }
      };
    });
})();