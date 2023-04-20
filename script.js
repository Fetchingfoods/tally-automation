document.getElementById('csvFile').addEventListener('change', function(event) {
    let file = event.target.files[0];
    let reader = new FileReader();

    reader.onload = function(progressEvent) {
        let lines = this.result.split('\n');
        let count = 0;

        for (let i = 0; i < lines.length; i++) {
            let columns = lines[i].split(',');
            if (columns[0].includes("foo")) {
                count++;
            }
        }
        
        document.getElementById('output').innerText = 'Number of rows containing "foo" in the first column: ' + count;
    };
    
    reader.readAsText(file);
});