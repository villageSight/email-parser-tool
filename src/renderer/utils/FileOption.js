const EmlParser = require('eml-parser');
const fs = require('fs');
// returns email content as a html string (without headers like subject, from, etc).
const getEmailBodyHtml = async (emlPath,outputFileName) => {
	const parser = new EmlParser(fs.createReadStream(emlPath));
	const htmlString = await parser.getEmailBodyHtml();
    try {
        fs.writeFileSync(outputFileName,htmlString)
    } catch (error) {
        throw error;
    }
};

// returns whole email as a html string (including headers like subject, from, etc).
const getEmailAsHtml = async (emlPath, outputFileName) => {
	const parser = new EmlParser(fs.createReadStream(emlPath));
	const htmlString = await parser.getEmailAsHtml();
    try {
        fs.writeFileSync(outputFileName,htmlString)
    } catch (error) {
        throw error;
    }
};

// return email as a png image
const getEmailAsPng = async (emlPath, format='png') => {
    let  file = fs.createReadStream(emlPath);
	const parser = new EmlParser(file);
	const stream   = await parser.convertEmailToStream(format);
    try {
        stream.pipe(fs.createWriteStream(file.path + '.' + format))
    } catch (error) {
        throw error;
    }
};
