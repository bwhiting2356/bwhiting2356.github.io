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
    if (company.length > 0) {
      return "img/company-logos/" + company.toLowerCase().replace(" ", "_") + ".png";
    } else {
      return "img/company-logos/dummy.png";
    }
    
  };
});

var dummy_course = {  
  "title":"",
  "date":"",
  "time":{  
     "hours": "",
     "minutes": ""
  },
  "company":"",
  "url":"",
  "dummy": true
};

bApp.controller('SkillsController', function SkillsController($scope, $http, $window) {
    $scope.sort_courses = function(field) {
      function compare(a, b) {
        if (field !== 'time') {
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
    };

    $scope.matching_course = function(course) {
        // test matching companies
        var companies = $scope.make_company_list();
        var matching_company = (companies.indexOf(course.company.toLowerCase()) > -1);

        // test matching search terms
        var matching_search_terms = true; // default to true if there are no search terms
        if ($scope.search.terms) {
          matching_search_terms = false;
          for (var term in $scope.search.terms) {
            if (course.title.toLowerCase().indexOf($scope.search.terms[term]) > -1) {
              matching_search_terms = true;
            }
          }
        }
        // test date constraints
        var course_date = new Date(course.date);  
        var within_date_constraints = ((course_date >= $scope.search.start_date) && (course_date <= $scope.search.end_date));
        return matching_company && matching_search_terms && within_date_constraints;
    };

    $scope.update_pagination_constraints = function() {
        $scope.can_increment = ($scope.current_page +1 !=  $scope.paginated_results.length);
        $scope.can_decrement = ($scope.current_page !== 0);
    };

    $scope.paginate_results = function() {
        var rows_per_page = 5;
        var current_row = 0;
        var current_page = 0;
        for (var i = 0; i < $scope.course_results.length; i++) {
          $scope.course_results[i].page = current_page;
          $scope.course_results[i].row = current_row;

          current_row += 1;
          if (current_row >= rows_per_page) {
            current_row = 0;
            current_page += 1;
          }
        }
        var new_array = [];
        var array_copy = $scope.course_results.slice();
        var section = [];

        if (array_copy.length > 0) {
          while (array_copy.length > 0) {
            section = array_copy.splice(0,rows_per_page);
            while (section.length < rows_per_page) {
              section.push(dummy_course);
            }
            new_array.push(section);
          }
          $scope.courses_returned = true;
        } else {
          for (var j = 0; j < rows_per_page; j++) {
            section.push(dummy_course);
          }
          new_array.push(section);
          $scope.courses_returned = false;
        }
        $scope.paginated_results = new_array;
        $scope.current_page = 0;
        $scope.update_pagination_constraints();
    };

    $scope.increment_page = function() {
      if ($scope.can_increment) {
        $scope.current_page += 1;
        $scope.update_pagination_constraints();
      }
    };

    $scope.decrement_page = function() {
      if ($scope.can_decrement)  {
        $scope.current_page -= 1;
        $scope.update_pagination_constraints();
      }
    };

    $scope.filter_courses = function() {
      $scope.course_results = $scope.all_courses.filter($scope.matching_course);
      console.log('course results');
      console.log($scope.course_results);
      console.log('all courses');
      console.log($scope.all_courses);

      $scope.sort_courses('date');

      if ($scope.course_results.length > 0) {
        $scope.earliest_course_date = $scope.course_results[0].date;
        $scope.latest_course_date = $scope.course_results.slice(-1)[0].date;

        setTimeout(function(){ 
          $scope.draw_chart($scope.course_results);
        }, 1);

        $scope.paginate_results();
      }
      $scope.compute_total_time();

    };

    $scope.compute_total_time = function() {
      var total_hours = 0;
      var total_minutes = 0;
      for (var i = 0; i < $scope.course_results.length; i++) {
        total_hours += $scope.course_results[i].time.hours;
        total_minutes += $scope.course_results[i].time.minutes;
      }
      var final_hours = Math.floor(total_minutes / 60) + total_hours;
      var final_minutes = total_minutes % 60;
      $scope.courses_total_time = {
        hours: final_hours,
        minutes: final_minutes
      };
    };

    // setting defaults
    $scope.search = {
        start_date: new Date("2014-09-04"),
        end_date: new Date(),
        companies: {
            'treehouse': true,
            'code school': true,
            'codecademy': true,
            'lynda': true,
            'smartly': true,
            'datacamp': true,
        }
    };
    console.log(new Date());

    $scope.make_company_list = function() {
      var companies = [];
      for (var company in $scope.search.companies) {
        if ($scope.search.companies[company] === true) {
          companies.push(company);
        }
      }
      return companies;
    };

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
            $scope.search.companies.datacamp = true;
        }
        $scope.filter_courses();
    };

    // when an individual company checkbox is changed, check to see if check_all should be updated
    $scope.update_check_all = function(model) {
        if ($scope.search.companies.treehouse && 
            $scope.search.companies['code school'] && 
            $scope.search.companies.codecademy && 
            $scope.search.companies.lynda && 
            $scope.search.companies.datacamp &&
            $scope.search.companies.smartly) {
            
            $scope.check_all = true;
        } else {
            $scope.check_all = false;
        }
        $scope.filter_courses();
    };

    $scope.update_date_constraint = function() {
      $scope.filter_courses();
    };

    $scope.draw_chart = function(data) {
      var chart_container = document.getElementById("chart-container");
      chart_container.innerHTML = '';
      var width = chart_container.offsetWidth;
      var chart = d3.select("#chart-container")
                      .append('svg')
                      .attr('id', 'chart')
                      .attr('height', 10)
                      .attr('width', width);

      var x = d3.time.scale().range([0, width - 4]);

      x.domain(d3.extent(data, function(d) { return new Date(d.date); }));

      var lines = chart.selectAll('line')
         .data(data)
         .enter()
        .append('line');
      lines.attr('x1', function(d) {
        return x(new Date(d.date));
      })
      .attr('x2', function(d) {
        return x(new Date(d.date));
      })
      .attr('y1', '1')
      .attr('y2', '10')
      .attr('class', function(d) {
        return d.company.toLowerCase().replace(' ', '_');
      })
      .classed('line', true)
      .on('mouseover', $scope.showHighlightedCourse)
      .on('mouseleave', $scope.removeHighlight);
    };

    $scope.showHighlightedCourse = function(d) {
      $scope.current_page = d.page;
      $scope.update_pagination_constraints();
      d.highlighted = true;
      $scope.$digest();
    };

    $scope.removeHighlight = function(d) {
      d.highlighted = false;
      $scope.$digest();
    };

    $scope.draw_chart2 = function(data) {
      var unsplit_data = [];
      for (var i = 0; i < data.length; i++) {
        unsplit_data.push.apply(unsplit_data, data[i]);
      }

      var chart_container = document.getElementById("chart-container");
      chart_container.innerHTML = '';
      var width = chart_container.offsetWidth;
      var chart = d3.select("#chart-container")
                      .append('svg')
                      .attr('id', 'chart')
                      .attr('height', 10)
                      .attr('width', width);

      var x = d3.time.scale().range([0, width - 4]);

      x.domain(d3.extent(unsplit_data, function(d) { return new Date(d.date); }));

      var lines = chart.selectAll('line')
         .data(unsplit_data)
         .enter()
        .append('line');
      lines.attr('x1', function(d) {
        return x(new Date(d.date));
      })
      .attr('x2', function(d) {
        return x(new Date(d.date));
      })
      .attr('class', function(d) {
        return d.company.toLowerCase().replace(' ', '_');
      })
      .attr('y1', '1')
      .attr('y2', '10')
      .classed('line', true)
      .on('mouseover', $scope.showHighlightedCourse)
      .on('mouseleave', $scope.removeHighlight);
    };

    angular.element($window)
    .bind('resize', function(){
      $scope.draw_chart($scope.course_results);
    })
    .bind('load', function(){
      $http
      .get('/data/courses.json')
      .then(function(response) {
        $scope.all_courses = response.data;
        $scope.filter_courses();
        $scope.update_check_all();
      });
    });
});