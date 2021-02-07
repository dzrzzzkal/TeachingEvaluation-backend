const officegen = require('officegen')
const fs = require('fs')


// https://www.cnblogs.com/liangyy/p/12466111.html
// https://blog.csdn.net/lvye1221/article/details/90339712
// https://www.npmjs.com/package/officegen
// https://www.cnblogs.com/jackson-yqj/p/10329448.html 抛出接口

const exportDocx = function(formData) {
  // Create an empty Word object:
  let docx = officegen('docx')

  // Officegen calling this function after finishing to generate the docx document:
  docx.on('finalize', function(written) {
    console.log(
      'Finish to create a Microsoft Word document.'
    )
  })

  let pObj = docx.createP()
  let content = JSON.stringify(formData)
  pObj.addText(content, {
    back: '70ff9f',
    shdType: 'pct12',
    shdColor: 'fff890'
  }) // Use pattern in the background.

  // We can even add images:
  // pObj.addImage('some-image.png')

  // Let's generate the Word document into a file:
  let out = fs.createWriteStream('C:\\Users\\Administrator\\Desktop\\example.docx')

  out.on('error', function(err) {
    console.log(err)
  })

  // Async call to generate the output file:
  docx.generate(out)
}

module.exports = {
  exportDocx
}


// // Create a new paragraph:
// let pObj = docx.createP()

// pObj.addText('Simple')
// pObj.addText(' with color', { color: '000088' })
// pObj.addText(' and back color.', { color: '00ffff', back: '000088' })

// pObj = docx.createP()

// pObj.addText('Since ')
// pObj.addText('officegen 0.2.12', {
//   back: '00ffff',
//   shdType: 'pct12',
//   shdColor: 'ff0000'
// }) // Use pattern in the background.
// pObj.addText(' you can do ')
// pObj.addText('more cool ', { highlight: true }) // Highlight!
// pObj.addText('stuff!', { highlight: 'darkGreen' }) // Different highlight color.

// pObj = docx.createP()

// pObj.addText('Even add                         ')
// pObj.addText('external link', { link: 'https://github.com' })
// pObj.addText('!')

// pObj = docx.createP()

// pObj.addText('Bold + underline', { bold: true, underline: true })

// pObj = docx.createP({ align: 'center' })

// pObj.addText('Center this text', {
//   border: 'dotted',
//   borderSize: 12,
//   borderColor: '88CCFF'
// })

// pObj = docx.createP()
// pObj.options.align = 'right'

// pObj.addText('Align this text to the right.')

// pObj = docx.createP()

// pObj.addText('Those two lines are in the same paragraph,')
// pObj.addLineBreak()
// pObj.addText('but they are separated by a line break.')

// docx.putPageBreak()

// pObj = docx.createP()

// pObj.addText('Fonts face only.', { font_face: 'Arial' })
// pObj.addText(' Fonts face and size.', { font_face: 'Arial', font_size: 40 })

// docx.putPageBreak()

// pObj = docx.createP()


