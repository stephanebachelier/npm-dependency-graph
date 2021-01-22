const d3 = require('d3')
const { JSDOM } = require('jsdom')

const tree = (data, { width, height }) => {
  const root = d3.hierarchy(data, d => {
    return d.dependencies
  })

  root.dx = 10
  root.dy = width / (root.height + 1)

  return d3
    .tree()
    .separation(function separation (a, b) {
      // return (a.parent === b.parent ? 10 : 15) / a.depth
      return (a.parent === b.parent ? 6 : 4) / a.depth
    })
    .nodeSize([root.dx, root.dy])(root)
}

const getLabel = label => {
  switch (label) {
    case 'version':
      return ({ name, version }) => `${name}@${version}`
    case 'name':
    default:
      return ({ name }) => name
  }
}

const buildChart = async (
  data,
  { width = 1500, height, label = 'name' } = {}
) =>
  new Promise(resolve => {
    const nodeLabel = getLabel(label)

    const document = new JSDOM().window.document
    const root = tree(data, { width, height })

    let x0 = Infinity
    let x1 = -x0
    root.each(d => {
      if (d.x > x1) x1 = d.x
      if (d.x < x0) x0 = d.x
    })

    const container = d3
      .select(document.body)
      .append('div')
      .attr('class', 'container')

    const svg = container
      .append('svg')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .attr('width', width)
      .attr('height', x1 - x0 + root.dx * 10)
      .attr('viewBox', [-50, -50, width + 50, x1 - x0 + root.dx * 10 + 50])

    const g = svg
      .append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 14)
      .attr('transform', d => {
        return `translate(${root.dy / 2},${root.dx - x0})`
      })

    g.append('g')
      .attr('fill', 'none')
      .attr('stroke', '#ddd')
      .attr('stroke-width', 1.5)
      .selectAll('path')
      .data(root.links())
      .join('path')
      .attr(
        'd',
        d3
          .linkHorizontal()
          .x(d => d.y + 19)
          .y(d => d.x)
      )

    const node = g
      .append('g')
      .attr('stroke-linejoin', 'round')
      .attr('stroke-width', 3)
      .selectAll('g')
      .data(root.descendants())
      .join('g')
      .attr('transform', d => `translate(${d.y},${d.x})`)

    node
      .append('circle')
      .attr('fill', d => (d.children ? 'steelblue' : '#ddd'))
      .attr('r', 8)
      .attr('stroke-width', 3)
      .attr('stroke', 'steelblue')

    node
      .append('text')
      .attr('dy', '0.31em')
      .attr('x', d => (d === root ? 6 : 10))
      .attr('y', d => (d === root ? 18 : 0))
      .attr('text-anchor', d => (d === root ? 'middle' : 'start'))
      .text(d => nodeLabel(d.data))
      .clone(true)
      .lower()
      .attr('stroke', 'white')

    resolve(container.html())
  })

module.exports = {
  buildChart
}
