const ipc = require('electron').ipcRenderer;

const Terminal = require('terminal.js');


let nodeTerm = null;
let sxTerm = null;
let nodeTermP =null;
let  sxTermP = null;
let miscTerm = null;
let miscTermP = null;

ipc.on('started', function(){
    console.log("Started!")
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
    

    document.getElementById('mapwin').onclick = function() {
        // start NoderServer
        ipc.send('start-browser','')
    }

    document.getElementById('higashiyama').onclick = function() {
        // start NoderServer
        ipc.send('do-higashiyama','')
    }

    document.getElementById('centrair').onclick = function() {
        // start NoderServer
        ipc.send('do-centrair','')
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

window.onresize = resize;
