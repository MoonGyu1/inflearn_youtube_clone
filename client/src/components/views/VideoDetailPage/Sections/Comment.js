import Axios from 'axios'
import React, { useState } from 'react'
import { useSelector } from 'react-redux';

function Comment(props) {
    const videoId = props.postId
    
    const user = useSelector(state => state.user);
    const [commentValue, setcommentValue] = useState("")
    
    const handleClick = (event) => {
        setcommentValue(event.currentTarget.value)
    }

    const onSubmit = (event) => {
        event.preventDefault();

        const variables = {
            content: commentValue,
            writer: user.userData._id, //using Redux
            postId: videoId
        }

        Axios.post('/api/comment/saveComment', variables)
        .then(response => {
            if(response.data.success) {
                console.log(response.data.result)
            } else {
                alert('Failed to save comment')
            }
        })
    }

    return (
        <div>
            <br />
            <p> Replies </p>
            <hr />

            {/* comment lists */}
            {/* Root Comment Form */}

            <form style={{ display:'flex'}} onSubmit={onSubmit}>
                <textarea
                    style={{width: '100%', borderRadius: '5px' }}
                    onChange={handleClick}
                    value={commentValue}
                    placeholder="Write a comment"
                />
                <br />
                <button style={{ width:'20%', height:'52px' }} onClick={onSubmit}>Submit</button>
            </form>
        </div>
    )
}

export default Comment
