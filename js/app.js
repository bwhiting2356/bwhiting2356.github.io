var bApp = angular.module('bApp', []);

bApp.controller('ShowController', function ShowController($scope, $http) {
    $http.get('/data/broadway.json').then(function(response) {
        $scope.shows = response.data;
    });
});

bApp.controller('ProjectController', function ProjectController($scope, $http) {
    $http.get('/data/projects.json').then(function(response) {
        $scope.projects = response.data;
    });
});

bApp.filter('makeCompanyIntoLogoUrl', function() {
  return function(company) {
    return "img/company-logos/" + company.toLowerCase().replace(" ", "_") + ".png";
  }
});

bApp.controller('SkillsController', function SkillsController($scope, $http) {
    $http.get('/data/courses.json').then(function(response) {
        $scope.all_courses = response.data;
        $scope.filter_courses();
        $scope.update_check_all();
    });

    $scope.sort_courses = function(field) {
      function compare(a, b) {
        if (field !== 'time') {
          console.log(a[field]);
          console.log(b[field]);
          if (a[field] < b[field]) {
            return -1;
          } else if (a[field] === b[field]) {
            return 0;
          } else if (a[field] > b[field]) {
            return 1;
          }
        } else {
          if (a.time.hours < b.time.hours) {
            return -1;
          } else if (a.time.hours > b.time.hours) {
            return 0;
          } else if (a.time.hours === b.time.hours) {
            if (a.time.minutes < b.time.minutes) {
              return -1;
            } else if (a.time.minutes === b.time.minutes) {
              return 0;
            } else if (a.time.minutes > b.time.minutes) {
              return 1;
            }
          }
        }
      }
      $scope.course_results = $scope.course_results.sort(compare);
      $scope.paginate_results();
    }

    $scope.matching_course = function(course) {
        // test matching companies
        var companies = $scope.make_company_list();
        var matching_company = companies.indexOf(course.company.toLowerCase()) > -1

        // test matching search terms
        var matching_search_terms = true; // default to true if there are no search terms
        if ($scope.search.terms) {
          matching_search_terms = false;
          for (term in $scope.search.terms) {
            if (course.title.toLowerCase().indexOf($scope.search.terms[term]) > -1) {
              matching_search_terms = true;
            }
          }
        }
        // test date constraints
        var course_date = new Date(course.date);  
        var within_date_constraints = ((course_date >= $scope.search.start_date) 
                                       && (course_date <= $scope.search.end_date));
        // console.log(course);
        return matching_company && matching_search_terms && within_date_constraints;
    }

    $scope.update_pagination_constraints = function() {
        $scope.can_increment = ($scope.current_page +1 !=  $scope.paginated_results.length);
        $scope.can_decrement = ($scope.current_page !== 0);
    }

    $scope.paginate_results = function() {
        var new_array = [];
        var array_copy = $scope.course_results.slice();
        while (array_copy.length > 0) {
          new_array.push(array_copy.splice(0,7));
        }
        $scope.paginated_results = new_array;
        $scope.current_page = 0;
        $scope.update_pagination_constraints();
    }

    $scope.increment_page = function() {
      if ($scope.can_increment) {
        $scope.current_page += 1;
        $scope.update_pagination_constraints();
      }
    }

    $scope.decrement_page = function() {
      if ($scope.can_decrement)  {
        $scope.current_page -= 1;
        $scope.update_pagination_constraints();
      }
    }

    $scope.filter_courses = function() {
      $scope.course_results = $scope.all_courses.filter($scope.matching_course);
      $scope.paginate_results();
      $scope.compute_total_time();
    }

    $scope.compute_total_time = function() {
      var total_hours = 0;
      var total_minutes = 0
      for (var i = 0; i < $scope.course_results.length; i++) {
        total_hours += $scope.course_results[i].time.hours;
        total_minutes += $scope.course_results[i].time.minutes;
      }
      var final_hours = Math.floor(total_minutes / 60) + total_hours;
      var final_minutes = total_minutes % 60;
      $scope.courses_total_time = {
        hours: final_hours,
        minutes: final_minutes
      }
    };

    // setting defaults
    $scope.search = {
        start_date: new Date("2014-09-04"),
        end_date: new Date("2016-07-04"),
        companies: {
            'treehouse': true,
            'code school': true,
            'codecademy': true,
            'lynda': true,
            'smartly': true,
        }
    };

    $scope.make_company_list = function() {
      var companies = [];
      for (company in $scope.search.companies) {
        if ($scope.search.companies[company] === true) {
          companies.push(company);
        }
      }
      return companies;
    }

    // convert raw input into trimmed and split array of search terms
    $scope.update_search_terms = function() {
        $scope.search.terms = $scope.raw_search.toLowerCase().trim().split(" ");
        $scope.filter_courses();
    };

    // when 'check_all' is changed
    $scope.update_inputs = function() {
        if ($scope.check_all) {
            $scope.search.companies.treehouse = true;
            $scope.search.companies['code school'] = true;
            $scope.search.companies.codecademy = true;
            $scope.search.companies.lynda = true;
            $scope.search.companies.smartly = true;
        }
        $scope.filter_courses();
    };

    // when an individual company checkbox is changed, check to see if check_all should be updated
    $scope.update_check_all = function(model) {
        if ($scope.search.companies.treehouse && 
            $scope.search.companies['code school'] && 
            $scope.search.companies.codecademy && 
            $scope.search.companies.lynda && 
            $scope.search.companies.smartly) {
            
            $scope.check_all = true;
        } else {
            $scope.check_all = false;
        }
        $scope.filter_courses();
    };

    $scope.update_date_constraint = function() {
      $scope.filter_courses();
    }

});
