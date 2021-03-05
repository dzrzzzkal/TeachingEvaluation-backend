const {AnnualReport} = require('@/models/index')

exports.annualReportCreate = async (data) => {
  let {submitter_id, submitter, college, dept, report_name} = data

  return await AnnualReport.create({
    submitter_id, submitter, college, dept, report_name
  })
}