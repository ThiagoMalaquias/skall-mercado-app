import { Alert, NativeModules } from 'react-native';

var NativeModulesE1 = NativeModules.ToastModules;

export default class PrinterService {
    async sendStartConnectionPrinterIntern() {
        const mapParam = {
            "typePrinter": "printerConnectInternal",
        };

        try {
            return await NativeModulesE1.abreConexaoImpressora(mapParam);
        } catch (error) {
            Alert.alert('Erro ao chamar nativo:', error);
            return null;
        }
    }

    async sendPrinterText(text, align, isBold, isUnderline, fontFamily, fontSize) {
        const mapParam = {
            "typePrinter": "printerText",
            "text": text,
            "align": align,
            "isBold": isBold,
            "isUnderline": isUnderline,
            "font": fontFamily,
            "fontSize": fontSize,
        };

        try {
            return await NativeModulesE1.imprimeTexto(mapParam);
        } catch (error) {
            Alert.alert('Erro ao chamar nativo:', error);
            return null;
        }
    };

    async jumpLine(quant) {
        const mapParam = {
            "typePrinter": "jumpLine",
            "quant": quant,
        };

        await NativeModulesE1.avancaLinhas(mapParam);
    };

    async cutPaper(quant) {
        const mapParam = {
            "typePrinter": "cutPaper",
            "quant": quant,
        };

        await NativeModulesE1.cutPaper(mapParam);
    }
}