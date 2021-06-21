const express = require('express');
const router = express.Router();
const { Video } = require("../models/Video");
const { Subscriber } = require("../models/Subscriber");
const { auth } = require("../middleware/auth");
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');

// STORAGE MULTER CONFIG
let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        if(ext !== '.mp4') {
            return cb(res.status(400).end('only mp4 is allowd'), false);
        }
        cb(null, true)
    }
});

const upload = multer({storage: storage}).single("file");

//=================================
//             Video
//=================================

router.post('/uploadfiles', (req, res) => {
    //비디오를 서버에 저장
    upload(req, res, err => {
        if(err) {
            return res.json({ success: false, err })
        }
        return res.json({ success: true, url: res.req.file.path, fileName: res.req.file.filename })
    })
})

router.post('/getVideoDetail', (req, res) => {
    Video.findOne({ "_id": req.body.videoId })
    .populate('writer')
    .exec((err, videoDetail) => {
        if(err) return res.status(400).send(err)
        return res.status(200).json({ success: true, videoDetail })
    })
})

router.post('/uploadVideo', (req, res) => {
    //비디오 정보를 mongoDB에 저장
    const video = new Video(req.body)

    video.save((err, doc) => {
        if(err) return res.json({ success: false, err })
        res.status(200).json({ success: true })
    })
})

router.post('/getSubscriptionVideos', (req, res) => {
    //자신의 아이디로 구독하는 사람들을 찾음
    Subscriber.find({ userFrom: req.body.userFrom })
    .exec((err, subscriberInfo) => {
        if(err) return res.status(400).send(err);
        
        let subscribedUser = [];
        
        subscriberInfo.map((subscriber, i) => {
            subscribedUser.push(subscriber.userTo);
        })

        //찾은 사람들의 비디오를 가져옴
        Video.find({ writer: { $in: subscribedUser } })
        .populate('writer')
        .exec((err, videos) => {
            if(err) return res.status(400).send(err);
            res.status(200).json({ success: true, videos })
        })
    }) 
})

router.get('/getVideos', (req, res) => {
    //비디오를 DB에서 가져와서 클라이언트에 전송
    Video.find()
    .populate('writer') //모든 정보를 가져오기 위해 populate
    .exec((err, videos) => {
        if(err) return res.status(400).send(err);
        res.status(200).json({ success:true, videos })
    })
})

router.post('/thumbnail', (req, res) => {
    let filePath = ""
    let fileDuration = ""
    
    //비디오 duration 가져오기
    ffmpeg.ffprobe(req.body.url, function (err, metadata) {
        console.dir(metadata) //all metadata
        console.log(metadata.format.duration);
        fileDuration = metadata.format.duration
    });

    // 썸네일 생성
    ffmpeg(req.body.url) //썸네일 파일 이름 생성
    .on('filenames', function(filenames) {
        console.log('Will generate ' + filenames.join(', '))
        console.log(filenames)

        filePath = 'uploads/thumbnails/' + filenames[0]
    })
    .on('end', function() { //썸네일 생성 끝난 후
        console.log('Screenshots taken');
        return res.json({ success: true, url: filePath, fileDuration: fileDuration });
    })
    .on('error', function(err) { //에러 발생 시
        console.error(err);
        return res.json({ success: false, err });
    })
    .screenshots({ //옵션
        // Will take screenshots at 20%, 40%, 60% and 80% of the video
        count: 3, //썸네일 3개
        folder: 'uploads/thumbnails',
        size: '320x240',
        //'%b': input basename (filename without extension)
        filename: 'thumbnail-%b.png'
    })
})

module.exports = router;