var xhttp = new XMLHttpRequest();

function addToCart(){
    id = document.getElementById("bookID").innerHTML
    stock = document.getElementById("stock").innerHTML
    id = id.split(' ')
    id = parseInt(id[2])
    xhttp.open("POST", "/order", false);
    xhttp.setRequestHeader('Content-Type', 'application/json')
    xhttp.send(JSON.stringify({id: id}))
    xhttp.onreadystatechange = function() {
		if(this.readyState == 4 && this.status == 201) {
            alert("Added To Cart")
        }
    }
}

function track(){
    trackNum = document.getElementById("trackingText").value
    xhttp.open("GET", "/track/" + trackNum, false);
    xhttp.send()
    xhttp.onreadystatechange = function() {
        res = JSON.parse(xhttp.response)
		if(this.readyState == 4 && this.status == 200) {
            document.getElementById("bookTitle").innerHTML = "Title: " + res['title']
            document.getElementById("address").innerHTML = "Address: " + res['address']
            document.getElementById("postal").innerHTML = "Postal Code: " + res['postcode']
            document.getElementById("sendProv").innerHTML = "Province: " + res['province']
            document.getElementById("sendCity").innerHTML = "City: " + res['city']
            document.getElementById("facility").innerHTML = "Facility: " + res['facility']
            document.getElementById("trucknum").innerHTML = "Truck Number: " + parseFloat(res['trucknum']).toFixed(0)
		}
        else if (this.status == 404){
            alert("Tracking Number Not Valid")
        }
	}
}

function register(){
    uName = document.getElementById("username").value
    pw = document.getElementById("password").value
    valid = 1
    xhttp.open("GET", "/info", false);
    xhttp.send()
    xhttp.onreadystatechange = function() {
        res = JSON.parse(xhttp.response)
		if(this.readyState == 4 && this.status == 200) {
            for (username in res['info']){
                if (uName.localeCompare(res['info'][username]['username']) == 0){
                    alert("Username already registered")
                    document.getElementById("username").value = ""
                    document.getElementById("password").value = ""
                    valid = 0
                }
            }
            console.log("VALID: " + valid)
            if (valid){
                xhttp.open("POST", "/register", false);
                xhttp.setRequestHeader('Content-Type', 'application/json')
                xhttp.send(JSON.stringify({username: uName, password: pw}))
            }
        }
    }
    
}

function login(){
    uName = document.getElementById("username").value
    pw = document.getElementById("password").value
    xhttp.open("GET", "/info", false);
    xhttp.send()
    xhttp.onreadystatechange = function() {
        res = JSON.parse(xhttp.response)
        console.log(res)
		if(this.readyState == 4 && this.status == 200) {
            for (user in res['info']){
                if("owner".localeCompare(uName) == 0 && "owner".localeCompare(pw) == 0){
                    alert("Welcome, Owner")
                    window.location.href= "http://localhost:3000/report" 
                    return
                }
                else if (uName.localeCompare(res['info'][user]['username']) == 0 && pw.localeCompare(res['info'][user]['password']) == 0){
                    alert("Successfully logged in, redirecting to home")
                    xhttp.open("POST", "/login", false);
                    xhttp.setRequestHeader('Content-Type', 'application/json')
                    xhttp.send(JSON.stringify({username: uName}))
                    window.location.href = "http://localhost:3000/"
                    return
                }
            }
            alert("Unregistered User - Please Try Again Or Register")
            document.getElementById("username").value = ""
            document.getElementById("password").value = ""
        }
    }
}

function signOut(){
    xhttp.open("POST", "/login", false);
        xhttp.setRequestHeader('Content-Type', 'application/json')
        xhttp.send(JSON.stringify({username: null}))
        alert("Logged Out, Thank You For Shopping")
        window.location.href = "http://localhost:3000/auth"
}

function loadCart(){
    xhttp.open("GET", "/cartInfo", false);
    xhttp.send()
    mainDiv = document.getElementById("mainDiv")
    sum = 0
    addButton = 0
    res = JSON.parse(xhttp.response)
    for (item in res['cart']){
        addButton = 1
        for (book in res['books']){
            if (item == res['books'][book]['id']){
                var bookDiv = document.createElement('div');
				bookDiv.id = item;
				bookDiv.innerHTML = res['books'][book]['title']
				mainDiv.appendChild(bookDiv);
                var priceDiv = document.createElement('div');
				priceDiv.innerHTML = "$" + parseFloat(res['books'][book]['price']) + " * " + res['cart'][item] + " = " + "$" + parseFloat(res['books'][book]['price']) * res['cart'][item]
				mainDiv.appendChild(priceDiv);
                var linebreak = document.createElement('p');
				mainDiv.appendChild(linebreak);
                sum += parseFloat(res['books'][book]['price']) * res['cart'][item]
            }
        }
    }
    if (addButton){
        submitDiv = document.getElementById("submitDiv")
        var totalDiv = document.createElement('div');
        totalDiv.innerHTML = "Total: $" + sum
        submitDiv.appendChild(totalDiv);
        var submitButton = document.createElement("button");
		submitButton.onclick = submit;
		submitButton.innerHTML=("Complete Order");
        submitDiv.appendChild(submitButton);
    }
}

function submit(){
    xhttp.open("GET", "/cartInfo", false);
    xhttp.send()
    res = JSON.parse(xhttp.response)
    const shipping_info = {
        address: document.getElementById("address").value,
        postal: document.getElementById("postal").value,
        province:  document.getElementById("province").value,
        city:  document.getElementById("city").value
    }
    const order = {
        trucknum: 8562,
        facility: "Main",
        city: "Toronto",
        province: "Ontario"
    }
    const payment_info = {
        number: document.getElementById("cardNum").value,
        cvv: document.getElementById("cvv").value,
        day: 19,
        month: 12,
        year: 2021
    }
    xhttp.open("POST", "/purchase", false);
    xhttp.setRequestHeader('Content-Type', 'application/json')
    xhttp.send(JSON.stringify({shipping: shipping_info, order: order, payment: payment_info}))
    xhttp.onreadystatechange = function() {
		if(this.readyState == 4 && this.status == 201) {
            alert("Purchase Complete - Thank You For Shopping!")
        }
    }
}

function searchTitle(){
    resultDiv = document.getElementById("result")
    resultDiv.innerHTML = ""
    search = document.getElementById("title").value
    xhttp.open("POST", "/result", false);
    xhttp.setRequestHeader('Content-Type', 'application/json')
    xhttp.send(JSON.stringify({type: "title", value: search}))
    res = JSON.parse(xhttp.response)
    for (book in res['books']){
        var bookDiv = document.createElement('a');
        bookDiv.href = "http://localhost:3000/books/" + res['books'][book]['id']
        bookDiv.innerHTML = res['books'][book]['title']
        resultDiv.appendChild(bookDiv);
        var detailDiv = document.createElement('div');
        detailDiv.innerHTML = res['books'][book]['genre'] + " - $" + res['books'][book]['price']
        resultDiv.appendChild(detailDiv)
    }

}

function searchAuthor(){
    resultDiv = document.getElementById("result")
    resultDiv.innerHTML = ""
    search = document.getElementById("author").value
    xhttp.open("POST", "/result", false);
    xhttp.setRequestHeader('Content-Type', 'application/json')
    xhttp.send(JSON.stringify({type: "author", value: search}))
    res = JSON.parse(xhttp.response)
    for (book in res['books']){
        var bookDiv = document.createElement('div');
        bookDiv.innerHTML = res['books'][book]['title']
        resultDiv.appendChild(bookDiv);
        var detailDiv = document.createElement('div');
        detailDiv.innerHTML = res['books'][book]['genre'] + " - $" + res['books'][book]['price']
        resultDiv.appendChild(detailDiv)
    }
}

function searchGenre(){
    resultDiv = document.getElementById("result")
    resultDiv.innerHTML = ""
    search = document.getElementById("genre").value
    xhttp.open("POST", "/result", false);
    xhttp.setRequestHeader('Content-Type', 'application/json')
    xhttp.send(JSON.stringify({type: "genre", value: search}))
    res = JSON.parse(xhttp.response)
    for (book in res['books']){
        var bookDiv = document.createElement('div');
        bookDiv.innerHTML = res['books'][book]['title']
        resultDiv.appendChild(bookDiv);
        var detailDiv = document.createElement('div');
        detailDiv.innerHTML = res['books'][book]['genre'] + " - $" + res['books'][book]['price']
        resultDiv.appendChild(detailDiv)
    }
}

function searchID(){
    resultDiv = document.getElementById("result")
    resultDiv.innerHTML = ""
    search = document.getElementById("id").value
    xhttp.open("POST", "/result", false);
    xhttp.setRequestHeader('Content-Type', 'application/json')
    xhttp.send(JSON.stringify({type: "id", value: search}))
    res = JSON.parse(xhttp.response)
    for (book in res['books']){
        var bookDiv = document.createElement('div');
        bookDiv.innerHTML = res['books'][book]['title']
        resultDiv.appendChild(bookDiv);
        var detailDiv = document.createElement('div');
        detailDiv.innerHTML = res['books'][book]['genre'] + " - $" + res['books'][book]['price']
        resultDiv.appendChild(detailDiv)
    }
}