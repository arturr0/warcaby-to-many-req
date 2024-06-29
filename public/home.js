$(document).ready(function() {
    console.log('Document is ready');
    function highlightUserRow() {
        $.get('/find')
            .done(function(jsonData) {
                jsonData.map((player, index) => {
                    if (player.players === 1) {
                        console.log(`Index ${index} has players === 1`);
                    }
                });
            })
            .fail(function(error) {
                console.error('Error fetching player data:', error);
            });
    }
    $('#createServer').on('click', function() {
        console.log('Create Server button clicked');
        $.post('/create-server')
            .done(function(data) {
                console.log('Server created:', data);
                $('tbody').append(`
                    <tr id="server-${data.index}">
                        <td class="server">SERVER ${data.index + 1}</td>
                        <td class="button_spin" data-index="${data.index}" data-players="${data.players}">
                            <button class="join visible">JOIN</button>
                            <i class="icon-spin5 hidden"></i>
                        </td>
                        <td class="players">${data.user1}</td>
                        <td class="players">${data.user2}</td>
                    </tr>
                `);
                attachJoinHandlers();
            })
            .fail(function(error) {
                console.error('Error:', error);
            });
    });

    function attachJoinHandlers() {
        $('.join').off('click').on('click', function(event) {
            event.preventDefault();
            const inputText = $('#inputText').val().trim();
            if (!inputText) {
                alert('Please enter text before joining a server.');
                return;
            }

            const $joinButton = $(this);
            $joinButton.prop('disabled', true); // Disable the join button

            const serverJoin = $joinButton.closest('.button_spin');
            const serverIndex = serverJoin.data('index');

            $.get('/servers-data')
                .done(function(jsonData) {
                    const latestServerData = jsonData[serverIndex];

                    if (latestServerData.user1 === inputText || latestServerData.user2 === inputText) {
                        alert('You cannot use the same name as an existing player.');
                        $joinButton.prop('disabled', false); // Re-enable the join button
                        return;
                    }

                    if (latestServerData.user1 === "") {
                        $.post('/submit', { inputText: inputText, index: serverIndex })
                            .done(function(data) {
                                console.log('User1 joined:', latestServerData);
                                localStorage.setItem('serverData', JSON.stringify({
                                    inputText: inputText,
                                    index: serverIndex,
                                    players: data.players,
                                    player: 1
                                }));

                                // Redirect only if successfully joined
                                window.location.href = '/warcaby';
                            })
                            .fail(function(error) {
                                console.error('Error:', error);
                                $joinButton.prop('disabled', false); // Re-enable the join button on failure
                            });
                    } else if (latestServerData.user2 === "" && latestServerData.block === 0) {
                        $.post('/submit', { inputText: inputText, index: serverIndex })
                            .done(function(data) {
                                console.log('User2 joined:', latestServerData);
                                localStorage.setItem('serverData', JSON.stringify({
                                    inputText: inputText,
                                    index: serverIndex,
                                    players: data.players,
                                    player: 2
                                }));

                                // Redirect only if successfully joined
                                window.location.href = '/warcaby';
                            })
                            .fail(function(error) {
                                console.error('Error:', error);
                                $joinButton.prop('disabled', false); // Re-enable the join button on failure
                            });
                    } else {
                        $joinButton.prop('disabled', false); // Re-enable the join button
                        const $spinIcon = $joinButton.parent('.button_spin').find('.icon-spin5');

                        $joinButton.removeClass('visible');
                        $joinButton.addClass('hidden');
                        $spinIcon.removeClass('hidden');
                        $spinIcon.addClass('animate-spin');
                    }
                })
                .fail(function(error) {
                    console.error('Error fetching latest server data:', error);
                    $joinButton.prop('disabled', false); // Re-enable the join button on failure
                });
        });
    }

    function updateServerList() {
        $.get('/servers-data')
            .done(function(jsonData) {
                console.log('Updating server list:', jsonData);
                jsonData.forEach((server, index) => {
                    let joinButton = 'FULL';
                    if (server.players < 2) {
                        joinButton = '<button class="join visible">JOIN</button>';
                    }

                    let $existingRow = $(`#server-${index}`);
                    if ($existingRow.length > 0) {
                        // Update existing row
                        $existingRow.find('.button_spin').attr('data-players', server.players).html(`
                            ${joinButton}
                            <i class="icon-spin5 hidden"></i>
                        `);
                        $existingRow.find('.players').eq(0).text(server.user1);
                        $existingRow.find('.players').eq(1).text(server.user2);
                    } else {
                        // Append new row
                        $('#serversTable tbody').append(`
                            <tr id="server-${index}">
                                <td class="server">SERVER ${index + 1}</td>
                                <td class="button_spin" data-index="${index}" data-players="${server.players}">
                                    ${joinButton}
                                    <i class="icon-spin5 hidden"></i>
                                </td>
                                <td class="players">${server.user1}</td>
                                <td class="players">${server.user2}</td>
                            </tr>
                        `);
                    }
                });
                attachJoinHandlers();
            })
            .fail(function(error) {
                console.error('Error updating server list:', error);
            });
    }
    $(document).on('click', '#find_players', function() {
        highlightUserRow(); // Highlight rows based on loaded player data
    });
    updateServerList();
    //setInterval(updateServerList, 5000); // Update server list every 5 seconds
});
