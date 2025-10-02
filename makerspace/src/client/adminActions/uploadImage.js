import axios from "axios";
import GlobalConfig from "../../../config/GlobalConfig";

export default async function imageUpload(image){

   
    try {
        const res = await axios.post(`${GlobalConfig.nodeUrl}/admin/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log(res.data);
      } catch (err) {
        console.error(err);
      }
    
}