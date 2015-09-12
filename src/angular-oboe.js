'use strict';
angular.module('ngOboe', [])
        .service('Oboe', ['OboeStream', function (OboeStream) {
                // the passed parameters object need to have a Url and a pattern.
                // all parameters consumed by the oboe module can be passed
                // the url needs to return a json stream. see the oboe documentation
                // the pattern contains a path which selects json objects from the stream
                return function (params) {
                    return OboeStream.get(params);
                };
            }])
        .factory('OboeStream', ['$q', function ($q) {
                return {
                    // the get function calls the oboe module to get the JSON data in a stream
                    get: function (params) {
                        var defer = $q.defer();
                        var stream = oboe(params)
                                // once the stream starts we can callback the start function if passed.
                                .start(function (status, headers) {
                                    if (typeof params.start === 'function' && status === 200) {
                                        params.start(stream);
                                    }
                                })
                                .fail(function (error) {
                                    defer.reject(error);
                                })
                                .done(function () {
                                    if (typeof params.done === 'function') {
                                        params.done();
                                    }
                                    // make sure oboe cleans up memory
                                    return oboe.drop;
                                });
                        if (params.pattern) {
                            // for every node containing the specified pattern or if not specified any node
                            stream.node(params.pattern || '.', function (node) {
                                    defer.notify(node);
                                    return oboe.drop;
                                });
                        }
                        if (params.patterns) {
                            angular.forEach(params.patterns, function(pattern) {
                                stream.on(pattern, function(node) {
                                    defer.notify(node, pattern);
                                    return oboe.drop;
                                });
                            });
                        }
                        return defer.promise;
                    }
                };
            }]);