
let mediaRecorder = null

const toggleButton = document.querySelector("#toggle")
toggleButton.addEventListener("click", toggleRecord)

async function  toggleRecord(){
mediaRecorder = mediaRecorder?stop(mediaRecorder): await start()
toggleButton.textContent = mediaRecorder?"Stop":"Start"
}

async function start(){
  // Gerar as streams da captura
            const videoStream  = await navigator.mediaDevices.getDisplayMedia( )
                                                                                               
            const audioStream = await navigator.mediaDevices.getUserMedia({audio:true})
                
            const stream = new MediaStream([videoStream.getTracks()[0],audioStream.getTracks()[0] ])
			
 // Instanciar o gravador           
			const mediaRecorder = new MediaRecorder(stream);
 
  		// Caso queira definir um codec específico suportado pelo navegador, pode ser feito da seguinte maneira
  		//	const mediaRecorder = new MediaRecorder(stream,{mimeType: "video/webm;codecs=VP9,pcm"});

  			const chunks = []
            mediaRecorder.ondataavailable = function(e) {
        						chunks.push(e.data);
      		};
  
  			mediaRecorder.onstop = ()=>{
              const mimeType = chunks[0].type
              console.log(mimeType)
            		const videoBlob = new Blob(chunks, {type:mimeType});
                    const videoUrl = URL.createObjectURL(videoBlob);
        			const a = document.createElement('a');
					a.href = videoUrl;
        			a.download = `gravacao_de_tela.${getExtension(mimeType)}`;
        			document.body.appendChild(a);
        			a.click();
            }
		
            mediaRecorder.start()
  return mediaRecorder
}

function getExtension(mimeType){
const types = [
  {mime:"video/mp4", ext:"mp4"},
  {mime:"video/x-matroska", ext:"mkv"},
  {mime:"video/webm", ext:"webm"}
]
  return types.filter(type=>{
  		if(mimeType.includes(type.mime)){
          console.log(type)
        	return true
        }
  })[0].ext
}

function stop(mr){
		const stream = mr.stream
        mr.stop();
        stream.getTracks().forEach(track => track.stop());
        return null
}

// Código que retorna os mimetypes suportados pelo seu navegador
// Fonte: https://stackoverflow.com/questions/41739837/all-mime-types-supported-by-mediarecorder-in-firefox-and-chrome
function getSupportedMimeTypes(media, types, codecs) {
  const isSupported = MediaRecorder.isTypeSupported;
  const supported = [];
  types.forEach((type) => {
    const mimeType = `${media}/${type}`;
    codecs.forEach((codec) => [
        `${mimeType};codecs=${codec}`,
        `${mimeType};codecs=${codec.toUpperCase()}`,
        // /!\ false positive /!\
        // `${mimeType};codecs:${codec}`,
        // `${mimeType};codecs:${codec.toUpperCase()}` 
      ].forEach(variation => {
        if(isSupported(variation)) 
            supported.push(variation);
    }));
    if (isSupported(mimeType))
      supported.push(mimeType);
  });
  return supported;
};


const videoTypes = ["webm", "ogg", "mp4", "x-matroska"];
const audioTypes = ["webm", "ogg", "mp3", "x-matroska"];
const codecs = ["should-not-be-supported","vp9", "vp9.0", "vp8", "vp8.0", "avc1", "av1", "h265", "h.265", "h264", "h.264", "opus", "pcm", "aac", "mpeg", "mp4a"];

const supportedVideos = getSupportedMimeTypes("video", videoTypes, codecs);
const supportedAudios = getSupportedMimeTypes("audio", audioTypes, codecs);

console.log('-- Top supported Video : ', supportedVideos[0])
console.log('-- Top supported Audio : ', supportedAudios[0])
console.log('-- All supported Videos : ', supportedVideos)
console.log('-- All supported Audios : ', supportedAudios)
