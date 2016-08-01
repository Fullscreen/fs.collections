import BaseCollection from './collection.js'
import BaseModel from './model.js'
import angular from 'angular'

angular.module('fs.collections', [])
.factory('BaseCollection', BaseCollection)
.factory('BaseModel', BaseModel)
