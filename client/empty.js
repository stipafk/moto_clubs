self.addEventListener('message', function(event){
    console.log("SW Received Message: " + event.data);
});