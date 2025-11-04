package com.sante20.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.sante20.entity.AttachmentType;
import com.sante20.entity.MessageAttachment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AttachmentResponse {
    
    private Long id;
    private AttachmentType type;
    private String url;
    private String filename;
    private Long fileSize;
    private String mimeType;
    
    public static AttachmentResponse fromEntity(MessageAttachment attachment) {
        return AttachmentResponse.builder()
            .id(attachment.getId())
            .type(attachment.getType())
            .url(attachment.getUrl())
            .filename(attachment.getFilename())
            .fileSize(attachment.getFileSize())
            .mimeType(attachment.getMimeType())
            .build();
    }
}