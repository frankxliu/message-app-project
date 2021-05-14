const socket = io();

// Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $locationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
  // new message element
  const $newMessage = $messages.lastElementChild

  // height of new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  // visible height
  const visibleHeight = $messages.offsetHeight

  // height of messages container
  const containerHeight = $messages.scrollHeight

  // how far scrolled
  const scrollOffset = $messages.scrollTop + visibleHeight

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight
  }
}

socket.on('message', (messageData) => {
  console.log(messageData);
  const html = Mustache.render(messageTemplate, {
    username: messageData.username,
    message: messageData.text,
    createdAt: moment(messageData.createdAt).format('h:mm A')
  });

  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
})

socket.on('locationMessage', (locationData) => {
  console.log(locationData);
  const html = Mustache.render(locationMessageTemplate, {
    username: locationData.username,
    url: locationData.position,
    createdAt: moment(locationData.createdAt).format('h:mm A')
  });

  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
})

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })
  document.querySelector('#sidebar').innerHTML = html;
})

$messageForm.addEventListener('submit', (e) => {
  e.preventDefault();

  $messageFormButton.setAttribute('disabled', true);

  const message = e.target.elements.message.value;
  
  socket.emit('sendMessage', message, (error) => {
    $messageFormButton.removeAttribute('disabled');
    $messageFormInput.value = '';
    $messageFormInput.focus();

    if (error) {
      return console.log(error);
    }

    console.log('Message delivered!');
  });
})

$locationButton.addEventListener('click', () => {

  $locationButton.setAttribute('disabled', true);

  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser.')
  }

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('sendLocation', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    }, () => {
      $locationButton.removeAttribute('disabled');
      console.log('Location shared!');
    });
  });
});

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error)
    location.href ='/'
  }
});