(function(){
  'use strict';
  angular.module('fsReferenceClientShared')
    .factory('ftrChangeUtils', function (fsApi, fsChangeUtils, $window, $firebase, FIREBASE_URL, ftrFeedLists) {

      var factory = {};

      var rootRef = new $window.Firebase(FIREBASE_URL);

      factory.isChangeOfInterest = function(change) {

        var type = fsChangeUtils.getType(change);
        var objectType = fsChangeUtils.getModifiedObjectType(change);

        if (objectType !== 'http://gedcomx.org/Person') {
          return false;
        }

        var interested = false;

        switch (type) {
          case 'http://gedcomx.org/Person':
          case 'http://gedcomx.org/Couple':
          case 'http://familysearch.org/v1/ChildAndParentsRelationship':
          case 'http://familysearch.org/v1/Man':
          case 'http://familysearch.org/v1/Woman':
          case 'http://familysearch.org/v1/Father':
          case 'http://familysearch.org/v1/Mother':
          case 'http://familysearch.org/v1/Child':
          case 'http://gedcomx.org/SourceReference':
          case 'http://familysearch.org/v1/EvidenceReference':
          case 'http://familysearch.org/v1/Affiliation':
          case 'http://gedcomx.org/Annulment':
          case 'http://gedcomx.org/BarMitzvah':
          case 'http://gedcomx.org/BatMitzvah':
          case 'http://gedcomx.org/Birth':
          case 'http://gedcomx.org/Burial':
          case 'http://gedcomx.org/Christening':
          case 'http://gedcomx.org/Cremation':
          case 'http://gedcomx.org/CommonLawMarriage':
          case 'http://gedcomx.org/Death':
          case 'http://gedcomx.org/Divorce':
          case 'http://gedcomx.org/Marriage':
          case 'http://gedcomx.org/MilitaryService':
          case 'http://gedcomx.org/Naturalization':
          case 'http://gedcomx.org/Occupation':
          case 'http://gedcomx.org/Religion':
          case 'http://gedcomx.org/Residence':
          case 'http://gedcomx.org/Stillbirth':
          case 'http://gedcomx.org/Fact':
          case 'http://gedcomx.org/Caste':
          case 'http://gedcomx.org/Clan':
          case 'http://gedcomx.org/NationalId':
          case 'http://gedcomx.org/Nationality':
          case 'http://gedcomx.org/PhysicalDescription':
          case 'http://gedcomx.org/Ethnicity':
          case 'http://gedcomx.org/Gender':
          case 'http://gedcomx.org/Name':
          case 'http://gedcomx.org/BirthName':
          case 'http://gedcomx.org/AlsoKnownAs':
          case 'http://gedcomx.org/MarriedName':
          case 'http://gedcomx.org/Nickname':
          case 'http://familysearch.org/v1/DiedBeforeEight':
          case 'http://familysearch.org/v1/TribeName':
          case 'http://familysearch.org/v1/BirthOrder':
          case 'http://familysearch.org/v1/LifeSketch':
          case 'http://familysearch.org/v1/TitleOfNobility':
          case 'http://familysearch.org/v1/Baptism':
          case 'http://familysearch.org/v1/Confirmation':
          case 'http://familysearch.org/v1/Initiatory':
          case 'http://familysearch.org/v1/Endowment':
          case 'http://familysearch.org/v1/Sealing':
          case 'http://familysearch.org/v1/NotAMatch':
            interested = true;
            break;
          case 'http://gedcomx.org/Note':
          case 'http://familysearch.org/v1/DiscussionReference':
          case 'http://familysearch.org/v1/LivingStatus':
            interested = false;
            break;
          default:
            console.log('Unhandled Change type: ' + type);
            break;
        }

        return interested;
      };

      function _touchOtherWatchers(userId, changeId) {
        var changeUsersRef = rootRef.child('/changes/' + changeId + '/users');
        changeUsersRef.once('value', function(snapshot) {
          var users = snapshot.val();
          if (users) {
            angular.forEach(users, function(user, id) {
              if (id !== userId) {
                var userChangeRef = rootRef.child('/users/' + id + '/changes/' + changeId);
                userChangeRef.update({updated: Firebase.ServerValue.TIMESTAMP});
                // TODO: need to set priority!!
              }
            });
          }
        });
      }

      factory.touchOtherWatchers = function(userId, changeId) {
        _touchOtherWatchers(userId, changeId);
      };

      factory.approve = function(userId, changeId, approveState) {

        var approvalsRef = $firebase(rootRef.child('/changes/' + changeId + '/approvals/' + userId));
        var userChangeRef = $firebase(rootRef.child('/users/' + userId + '/changes/' + changeId));

        if (approveState === true) {
          console.log('approved change ' + changeId);

          approvalsRef.$set(true);
          userChangeRef.$update({approved: true});
        }
        else {
          console.log('disapproved change ' + changeId);

          approvalsRef.$remove();
          userChangeRef.$update({approved: false});
        }

        _touchOtherWatchers(changeId);
      };

      factory.addComment = function(userId, userName, changeId, text) {

        console.log('adding comment \"' + text + '\" to change ' + changeId);

        if (text && text.length > 0) {

          var commentsRef = $firebase(rootRef.child('/changes/' + changeId + '/comments'));

          var commentObj = {
            userId: userId,
            by: userName,
            text: text,
            t: $window.Firebase.ServerValue.TIMESTAMP
          };

          commentsRef.$push(commentObj);

          ftrFeedLists.updateItem(changeId);         
          _touchOtherWatchers(changeId);
        }
      };

      factory.requestReview = function(userId, changeId, requestState) {

        var reviewersRef = $firebase(rootRef.child('/changes/' + changeId + '/reviewers/' + userId));
        var userChangeRef = $firebase(rootRef.child('/users/' + userId + '/changes/' + changeId));

        if (requestState === true) {
          reviewersRef.$set(true);
          userChangeRef.$update({reviewing: true});
        }
        else {
          reviewersRef.$remove();
          userChangeRef.$update({reviewing: false});
        }

        _touchOtherWatchers(changeId);
      };

      return factory;
    });
})();