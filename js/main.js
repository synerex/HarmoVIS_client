const ipc = require('electron').ipcRenderer;


const Terminal = require('terminal.js');


let nodeTerm = null;
let sxTerm = null;
let nodeTermP =null;
let  sxTermP = null;
let miscTerm = null;
let miscTermP = null;

let mapbox_token_config = "enter mapbox token"

var dlg

ipc.on('started', function(){
    console.log("Started!")
    dlg = document.querySelector('#input-mapbox-token');
//    console.log("dlg",dlg)

/*
    dlg.addEventListener('cancel', (event) => {
        'use strict';
        console.log("Canceled");
        event.preventDefault();
    });
*/  


    nodeTermP = document.getElementById('nodeterm')
//    console.log('node:',nodeTermP)
    nodeTerm = new Terminal({columns:100,rows:200})
    nodeTerm.state.setMode('crlf', true);
    nodeTerm.dom(nodeTermP)
    nodeTerm.write("")
//    cs.appendChild(nodeTerm.html)

    sxTerm = new Terminal({columns:100,rows:200})
    sxTerm.state.setMode('crlf', true);
    sxTermP = document.getElementById('sxterm')
//    console.log("sx",sxTermP)
    sxTerm.dom(sxTermP)
    sxTerm.write("")
 //   cs.appendChild(sxTerm.html)

    hvTerm = new Terminal({columns:100,rows:200})
    hvTerm.state.setMode('crlf', true);
    hvTermP = document.getElementById('hvterm')
//    console.log("sx",sxTermP)
    hvTerm.dom(hvTermP)
    hvTerm.write("start")


    // for other programs
    miscTerm = new Terminal({columns:100,rows:200})
    miscTerm.state.setMode('crlf', true);
    miscTermP = document.getElementById('miscterm')
    miscTerm.dom(miscTermP)
    miscTerm.write("misc")

    document.getElementById('toggle_nodeserv').onclick = function(e) {
        // start NoderServer
        if (e.currentTarget.checked == true){
            ipc.send('start-nodeserv','')
        }else{
            ipc.send('stop-nodeserv','')
        }
    }

    document.getElementById('toggle_sxserv').onclick = function(e) {
        if (e.currentTarget.checked == true){
            ipc.send('start-sxserv','')
        }else{
            ipc.send('stop-sxserv','')
        }
    }
    document.getElementById('toggle_harmovis').onclick = function(e) {
        if (e.currentTarget.checked == true){
            ipc.send('start-harmovis','')
        }else{
            ipc.send('stop-harmovis','')
        }
    }
    document.getElementById('toggle_proxy').onclick = function(e) {
        if (e.currentTarget.checked == true){
            ipc.send('start-prserv','')
        }else{
            ipc.send('stop-prserv','')
        }
    }
/*
    document.getElementById('toggle_save_message').onclick = function(e) {
        if (e.currentTarget.checked == true){
            ipc.send('start-save','')
        }else{
            ipc.send('stop-save','')
        }
    }    
    document.getElementById('playMessage').onclick = function() {
        // start NoderServer
        ipc.send('do-playMessage','')
    }


    */
    document.getElementById('mapwin').onclick = function() {
        // start NoderServer
        ipc.send('start-browser','')
    }

    /*
    document.getElementById('higashiyama').onclick = function() {
        // start NoderServer
        ipc.send('do-higashiyama','')
    }

    document.getElementById('centrair').onclick = function() {
        // start NoderServer
        ipc.send('do-centrair','')
    }

    document.getElementById('runSim').onclick = function() {
        // start NoderServer
        ipc.send('do-simulation','')
    }

    document.getElementById('covid19').onclick = function() {
        ipc.send('do-covid19','')
    }

    document.getElementById('meshdemo').onclick = function() {
        ipc.send('do-meshdemo','')
    }
    */

    document.getElementById('tgcontrol').onclick = function() {
        ipc.send('do-tgcontrol','')
    }

    document.getElementById('set_state').onclick = function() {
        miscTerm.write("setState")
        ipc.send('do-set_state','')
    }

    document.getElementById('run_sim').onclick = function() {
        ipc.send('do-run_sim','')
    }

    document.getElementById('speed_up').onclick = function() {
        ipc.send('do-speed_up','')
    }

    document.getElementById('speed_down').onclick = function() {
        ipc.send('do-speed_down','')
    }

})


ipc.on('nodelog', function(event, data){
    nodeTerm.write(data)
    nodeTermP.scrollTo({
        top: (nodeTerm.state.cursor.y-10) * 15,
        left: 0,
        behavior: 'smooth'
    } )
//    console.log('Got:'+data, 'scrooll'+ nodeTerm.state.cursor.y*10)

})
ipc.on('sxlog', function(event, data){
    sxTerm.write(data)
    sxTermP.scrollTo({
        top: (sxTerm.state.cursor.y-10) * 15,
        left: 0,
        behavior: 'smooth'
    } )
 //   console.log('Got:'+data)
 //   console.log('SXscrooll'+ sxTerm.state.cursor.y*10)
})

ipc.on('hvlog', function(event, data){
    hvTerm.write(data)
    hvTermP.scrollTo({
        top: (hvTerm.state.cursor.y-10) * 15,
        left: 0,
        behavior: 'smooth'
    } )
 //   console.log('Got:'+data)
 //   console.log('SXscrooll'+ sxTerm.state.cursor.y*10)
})

ipc.on('misclog', function(event, data){
    miscTerm.write(data)
    miscTermP.scrollTo({
        top: (miscTerm.state.cursor.y-10) * 15,
        left: 0,
        behavior: 'smooth'
    } )
})

ipc.on("mapbox-dialog", function(event, data){

    console.log("do-mapboxset token",data)
    if (data.length == 0){
        data = mapbox_token_config
    }
    showMapboxDialogElement(data)
})

ipc.on("set-mapbox-token", function(event, data){
    console.log("set token:[",data,"]")
    mapbox_token_config = data
})



// resize!
function resize() { 
    let size= window.innerHeight - 25*4
    let pxsize = Math.round(size/3.5)

    if (nodeTermP != null) {
        nodeTermP.style.height = pxsize+"px";
//        console.log("Set", nodeTermP.style)
    }
    if (sxTermP != null) {
        sxTermP.style.height = pxsize+"px";
//        console.log("SetSx", sxTermP.style)
    }
    if (hvTermP != null) {
        hvTermP.style.height = pxsize+"px";
//        console.log("SetHv", hvTermP.style)
    }
    if (miscTermP != null) {
        miscTermP.style.height = Math.round(size-pxsize*3)+"px";
//        console.log("SetHv", hvTermP.style)
    }
}

function showMapboxDialogElement(data) {
    'use strict';

    document.querySelector('#input').value = data
    dlg.showModal();

    function onClose(event) {
            dlg.removeEventListener('close', onClose);
            if (dlg.returnValue === 'ok') { //returnValueにvalue属性の値が入る
                const inputValue = document.querySelector('#input').value;//入力値を取得
                mapbox_token_config = inputValue;
                ipc.send('mapbox-token',inputValue)
            } 
    }
    dlg.addEventListener('close', onClose, {once: true});
}


window.onresize = resize;
