function responsivefy(svg) {
  // make SVGs responsive
  // Credit:  Ben Clinkinbeard
  // https://benclinkinbeard.com/d3tips/make-any-chart-responsive-with-one-function/?utm_content=buffer976d6&utm_medium=social&utm_source=twitter.com&utm_campaign=buffer

  // container will be the DOM element
  // that the svg is appended to
  // we then measure the container
  // and find its aspect ratio
  const container = d3.select(svg.node().parentNode),
      width = parseInt(svg.style('width'), 10),
      height = parseInt(svg.style('height'), 10),
      aspect = width / height;

  // set viewBox attribute to the initial size
  // control scaling with preserveAspectRatio
  // resize svg on inital page load
  svg.attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMinYMid')
      .call(resize);

  // add a listener so the chart will be resized
  // when the window resizes
  // multiple listeners for the same event type
  // requires a namespace, i.e., 'click.foo'
  // api docs: https://goo.gl/F3ZCFr
  d3.select(window).on(
      'resize.' + container.attr('id'),
      resize
  );

  // this is the code that resizes the chart
  // it will be called on load
  // and in response to window resizes
  // gets the width of the container
  // and resizes the svg to fill it
  // while maintaining a consistent aspect ratio
  function resize() {
    var reduceWidth = 30;
    // console.log(container.attr('id'));
    // console.log(container.style('width'));
    const w = parseInt(container.style('width')) - reduceWidth;
    // console.log(w);
    svg.attr('width', w);
    svg.attr('height', Math.round(w / aspect));
  }
  // $(document).ready(function($) {
  //   $(window).resize(function() {
  //     console.log($('#divMap').width());
  //   })
  // });
}
