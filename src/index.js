/* global angular */
import BaseCollection from './collection.js'
import BaseModel from './model.js'

angular.module('fs.collections', [])
.factory('BaseCollection', BaseCollection)
.factory('BaseModel', BaseModel)
