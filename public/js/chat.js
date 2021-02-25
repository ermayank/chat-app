const socket = io()

//Elements
const $messageForm = document.querySelector('#messageForm')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#sendLocation')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true})

const autoScroll = () =>{
    // New message Element
    const $newMessage = $messages.lastElementChild

    // Height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible Height
    const visibleHeight = $messages.offsetHeight

    // Height of message container
    const containerHeight = $messages.scrollHeight

    //How far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight 
    }

}

//Message event
socket.on('message', (msg)=>{
    const html = Mustache.render(messageTemplate, {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

//Send Location Event
socket.on('locationMessage', (msg) => {
    const html = Mustache.render(locationMessageTemplate, {
        username: msg.username,
        url: msg.url,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

//Get users in Room
socket.on('roomData', ({ room, users}) =>{
   const html = Mustache.render(sidebarTemplate, { room, users})
   document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e)=>{
    e.preventDefault()
    //Disable form at this point

    $messageFormButton.setAttribute('disabled', 'disabled')

    const msgValue = e.target.msgValue.value
    socket.emit('sendMessage', msgValue, (error)=>{
        //Re enable form at this point
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()


        if(error){
            return console.log(error)
        }
        console.log('Message was delivered!')

    })
})

$sendLocationButton.addEventListener('click', ()=>{
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
        
        const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }

        socket.emit('sendLocation', location, ()=>{
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!')
        })

})
})

//Room join
socket.emit('join', {username, room}, (error) =>{
    if (error) {
        alert(error)
        location.href = '/'
    }
})