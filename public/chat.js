document.addEventListener('socketConnected', function() {
    console.log(Player); // Should log "Initialized Player"

    // Remove any existing 'chat' event listeners to avoid duplication
    socket.off('chat');

    // Register the 'chat' event listener
    socket.on('chat', function(MESS, SENDER) {
        let messRec = String(MESS);
        let message = document.getElementById("messages");

        message.innerHTML += (`<div class="messRec" style="word-break: break-word">${messRec}</div>`);
        jQuery("#messages").scrollTop(jQuery("#messages")[0].scrollHeight);
        let messRecElements = document.getElementsByClassName("messRec");
        if (SENDER == 2) {
            for (let element of messRecElements) {
                element.style.color = "green";
            }
        } else if (SENDER == 1) {
            for (let element of messRecElements) {
                element.style.color = "red";
            }
        }

        console.log(messRec);
    });

    if (document.getElementById("text")) {
        document.getElementById("text").addEventListener("keydown", function(e) {
            let inputVal = document.getElementById("text").value;
            let inputValString = String(inputVal);
            if (e.key === 'Enter') {
                if (inputVal !== null && inputVal.trim() !== '') {
                    let message = document.getElementById("messages");
                    message.innerHTML += (`<div class="messSend" style="word-break: break-word">${inputValString}</div>`);

                    let messSendElements = document.getElementsByClassName("messSend");
                    if (Player == 2) {
                        for (let element of messSendElements) {
                            element.style.color = "green";
                        }
                    } else if (Player == 1) {
                        for (let element of messSendElements) {
                            element.style.color = "red";
                        }
                    }

                    socket.emit('send message', inputValString, room, Player);
                    document.getElementById("text").value = "";
                    console.log(inputVal);
                    jQuery("#messages").scrollTop(jQuery("#messages")[0].scrollHeight);
                }
            }
        });
    }
});
