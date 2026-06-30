import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff'
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 4,
    borderBottomColor: '#000000',
    paddingBottom: 10,
  },
  eventName: {
    fontSize: 28,
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
  },
  bandDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
  },
  // Alinha as duas colunas principais lado a lado
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  // Garante que cada coluna empilhe os itens de cima para baixo
  column: {
    width: '47%',
    flexDirection: 'column',
  },
  songItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  songIndex: {
    fontSize: 16,
    color: '#999999',
    width: 28,
    fontFamily: 'Helvetica-Bold',
  },
  songTitle: {
    fontSize: 16,
    color: '#000000',
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
    flex: 1,
  },
  dividerItem: {
    width: '100%',
    marginBottom: 16,
    paddingBottom: 4,
    justifyContent: 'center',
  },
  dividerText: {
    fontSize: 12,
    color: '#000000',
    backgroundColor: '#eeeeee',
    padding: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
  }
});

const truncate = (str, max) => {
  if (!str) return "";
  return str.length > max ? str.substring(0, max - 2) + ".." : str;
};

export const SetlistPdfDocument = ({ eventName, bandName, date, orderedItems }) => {
  let songCounter = 1;

  // 1. IMPORTANTE: Adiciona a numeração original sequencial (01, 02...) ANTES de fatiar,
  // para que a contagem do show continue certa ao dividir as colunas.
  const itemsWithNumbers = orderedItems.map((item) => {
    if (item.item_type === 'divider') {
      return { ...item, isDivider: true };
    } else {
      const currentNum = songCounter++;
      return { ...item, isDivider: false, songNumber: currentNum };
    }
  });

  // 2. Divide o array de itens ao meio verticalmente
  const half = Math.ceil(itemsWithNumbers.length / 2);
  const leftColumn = itemsWithNumbers.slice(0, half);
  const rightColumn = itemsWithNumbers.slice(half);

  // Função auxiliar para renderizar os cards de uma coluna específica
  const renderColumn = (columnItems) => {
    return columnItems.map((item, idx) => {
      if (item.isDivider) {
        return (
          <View key={item.id || idx} style={styles.dividerItem}>
            <Text style={styles.dividerText}>{truncate(item.content || "---", 25)}</Text>
          </View>
        );
      }

      const song = item.songs;
      const title = song ? song.title : "Música Deletada";

      return (
        <View key={item.id || idx} style={styles.songItem}>
          <Text style={styles.songIndex}>{item.songNumber.toString().padStart(2, '0')}</Text>
          <Text style={styles.songTitle}>{truncate(title, 22)}</Text>
        </View>
      );
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* CABEÇALHO DO PDF */}
        <View style={styles.header}>
          <Text style={styles.eventName}>{eventName || "MEU SETLIST"}</Text>
          <View style={styles.bandDateRow}>
            <Text style={styles.subtitle}>{bandName || "Banda / Artista"}</Text>
            <Text style={styles.subtitle}>
              {date ? new Date(date + 'T12:00:00').toLocaleDateString('pt-BR') : ""}
            </Text>
          </View>
        </View>

        {/* ESTRUTURA DE DUAS COLUNAS VERTICAIS PURAS */}
        <View style={styles.grid}>
          <View style={styles.column}>
            {renderColumn(leftColumn)}
          </View>
          <View style={styles.column}>
            {renderColumn(rightColumn)}
          </View>
        </View>

      </Page>
    </Document>
  );
};