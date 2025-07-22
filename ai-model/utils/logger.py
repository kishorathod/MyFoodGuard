import logging
import logging.handlers
import os
import sys
from datetime import datetime
from pathlib import Path

class Logger:
    """Centralized logging utility for the AI model"""
    
    def __init__(self, name="ai_model", log_level=logging.INFO):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(log_level)
        
        # Prevent duplicate handlers
        if not self.logger.handlers:
            self._setup_handlers()
    
    def _setup_handlers(self):
        """Setup console and file handlers"""
        # Create logs directory if it doesn't exist
        log_dir = Path("logs")
        log_dir.mkdir(exist_ok=True)
        
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)
        console_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        console_handler.setFormatter(console_formatter)
        self.logger.addHandler(console_handler)
        
        # File handler with rotation
        file_handler = logging.handlers.RotatingFileHandler(
            log_dir / "ai_model.log",
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        file_handler.setLevel(logging.DEBUG)
        file_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
        )
        file_handler.setFormatter(file_formatter)
        self.logger.addHandler(file_handler)
        
        # Error file handler
        error_handler = logging.handlers.RotatingFileHandler(
            log_dir / "ai_model_errors.log",
            maxBytes=5*1024*1024,  # 5MB
            backupCount=3
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(file_formatter)
        self.logger.addHandler(error_handler)
    
    def info(self, message, **kwargs):
        """Log info message"""
        self.logger.info(message, extra=kwargs)
    
    def debug(self, message, **kwargs):
        """Log debug message"""
        self.logger.debug(message, extra=kwargs)
    
    def warning(self, message, **kwargs):
        """Log warning message"""
        self.logger.warning(message, extra=kwargs)
    
    def error(self, message, **kwargs):
        """Log error message"""
        self.logger.error(message, extra=kwargs)
    
    def critical(self, message, **kwargs):
        """Log critical message"""
        self.logger.critical(message, extra=kwargs)
    
    def log_prediction(self, input_data, prediction, confidence, processing_time):
        """Log prediction details"""
        self.info(
            "Prediction made",
            input_data=input_data,
            prediction=prediction,
            confidence=confidence,
            processing_time=processing_time
        )
    
    def log_model_load(self, model_path, load_time):
        """Log model loading details"""
        self.info(
            "Model loaded successfully",
            model_path=model_path,
            load_time=load_time
        )
    
    def log_training(self, epochs, accuracy, loss, training_time):
        """Log training details"""
        self.info(
            "Training completed",
            epochs=epochs,
            accuracy=accuracy,
            loss=loss,
            training_time=training_time
        )
    
    def log_error(self, error, context=None):
        """Log error with context"""
        self.error(
            f"Error occurred: {str(error)}",
            error_type=type(error).__name__,
            context=context
        )

# Global logger instance
logger = Logger()

def get_logger(name=None):
    """Get logger instance"""
    if name:
        return Logger(name)
    return logger 